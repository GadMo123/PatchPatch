// src/game/Game.ts - Represents a single game object.

import { Server } from "socket.io";
import { Player } from "../player/Player";
import { DetailedGameState, GamePhase } from "./broadcasting/GameState";
import { PlayerInGame } from "./types/PlayerInGame";
import { GameStateBroadcaster } from "./broadcasting/GameStateBroadcaster";

import { Deck } from "./types/Deck";
import { TableConfig } from "./betting/BettingTypes";
import { ArrangePlayerCardsState } from "./arrangeCards/ArrangePlayerCardsManager";
import { SingleGameFlowManager } from "./utils/SingleGameFlowManager";
import { Mutex } from "async-mutex";
import { Card, Position } from "@patchpatch/shared";
import {
  assignPositions,
  RotateButtonPosition,
} from "./utils/PokerPositionsUtils";
import { PotManager } from "./utils/PotUtils/PotManager";

export class Game {
  private _deck: Deck | null;
  private _state: DetailedGameState;
  private _broadcaster: GameStateBroadcaster;
  private _isHandWonWithoutShowdown: boolean;
  private _potManager: PotManager;
  private _gameFlowManager: SingleGameFlowManager | null;
  private _stacksUpdatesForNextHand: Array<[PlayerInGame, number]>;
  private _TableConditionChangeMutex: Mutex; // For any async changes in table resources such as positions, seats ect.

  constructor(
    id: string,
    stakes: string,
    private _server: Server,
    tableConfig: TableConfig
  ) {
    this._server = _server;
    this._potManager = new PotManager();
    this._broadcaster = new GameStateBroadcaster(_server);
    this._TableConditionChangeMutex = new Mutex();
    this._isHandWonWithoutShowdown = false;
    this._state = {
      id,
      stakes,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      potSize: 0,
      observers: new Set<Player>(),
      playerInPosition: new Map<Position, PlayerInGame | null>(),
      playersAbsolutePosition: new Array<PlayerInGame | null>(
        tableConfig.maxPlayers
      ).fill(null),
      tableConfig: tableConfig,
      bettingState: null,
      arrangePlayerCardsState: null,
    };
    this._deck = null;
    this._gameFlowManager = null;
    this._stacksUpdatesForNextHand = new Array<[PlayerInGame, number]>();
  }

  async PrepareNextHand(): Promise<boolean> {
    this._potManager = new PotManager();
    this._isHandWonWithoutShowdown = false;
    this._state = {
      ...this._state,
      flops: [],
      turns: [],
      rivers: [],
      potSize: 0,
    };

    return await this._TableConditionChangeMutex.runExclusive(async () => {
      // Apply stack updates that we saved during the last hand ( = buyins of active players happens after the hand done)
      this._stacksUpdatesForNextHand.forEach(([player, amount]) => {
        player.updatePlayerPublicState({
          currentStack: player.getStack() + amount,
        });
        player.isReadyToStartHand;
      });
      // Clear the stacks-update list after applying them
      this._stacksUpdatesForNextHand = [];

      // Extract the list of next hand players
      const nextHandPlayers = this._state.playersAbsolutePosition.filter(
        (
          player
        ): player is PlayerInGame => // convince TS compiler that player cannot be null
          !!player &&
          player.isReadyToStartHand(this._state.tableConfig.bbAmount)
      );

      // Players map can change between the check of number of ready players (which runs async with players actions such as sitting out)
      // in this case we have to stop hand praperation and go into waiting mode.
      if (nextHandPlayers.length < this._state.tableConfig.minPlayers) {
        this._state.phase = GamePhase.Waiting;
        return false; // Releases lock and signal game flow manager to wait for players.
      }

      const nextHandBTNPlayer = RotateButtonPosition(
        this._state.playerInPosition
          .get(Position.BTN || Position.SB)
          ?.getTablePosition(), // SB for HU.
        nextHandPlayers
      );

      this._state.playerInPosition = assignPositions(
        nextHandPlayers,
        nextHandBTNPlayer.getId()
      );

      // Reset all players' state for the next hand
      this._state.playerInPosition.forEach((player, position) => {
        if (player) {
          player.updatePlayerPublicState({
            isFolded: false,
            pokerPosition: position,
            isAllIn: player.getStack() === 0, // Should always be false
          });
        }
      });

      this._state.phase = GamePhase.DealPreflop;
      return true;
    });
  }

  dealNewHand() {
    console.log("deal new hand");
    this._deck = new Deck();
    this._state.phase = GamePhase.PreflopBetting;
    this._state.playerInPosition.forEach((player) => {
      // As for the current scope - a player can only play a hand with >= 1BB stack
      if (player?.isActive()) {
        player.updatePlayerPrivateState({
          cards: this._deck!.getPlayerCards(),
        });
      }
    });
  }

  updateGameStateAndBroadcast(
    updates: Partial<DetailedGameState> | null,
    afterFunction: (() => void) | null
  ) {
    if (updates) this._state = { ...this._state, ...updates };
    this._broadcaster.broadcastGameState(this, afterFunction);
  }

  async startGame() {
    await this._TableConditionChangeMutex.runExclusive(async () => {
      if (this._gameFlowManager) return;
      this._gameFlowManager = new SingleGameFlowManager(this);
      this._state.phase = GamePhase.StartingHand;
      setImmediate(() => this._gameFlowManager?.startNextStreet());
    });
  }

  // When a player enter game, first he enter as an observer
  async addObserver(player: Player) {
    this._TableConditionChangeMutex.runExclusive(async () => {
      this._state.observers.add(player);
    });
    setImmediate(() => this.updateGameStateAndBroadcast(null, null));
  }

  // When an observer choose a seat in the game and become a player in the game.
  async addPlayer(
    player: Player,
    tableAbsolutePosition: number
  ): Promise<boolean> {
    return await this._TableConditionChangeMutex.runExclusive(async () => {
      // Check if the position is available
      if (
        this._state.playersAbsolutePosition.length <= tableAbsolutePosition ||
        this._state.playersAbsolutePosition[tableAbsolutePosition] !== null
      )
        return false;

      const newPlayerInGame = new PlayerInGame(
        player,
        this,
        null,
        tableAbsolutePosition
      );
      this._state.playersAbsolutePosition[tableAbsolutePosition] =
        newPlayerInGame;

      // Remove player as an observers
      this._state.observers.delete(player);

      // Broadcast after lock release
      setImmediate(() => this.updateGameStateAndBroadcast(null, null));
      return true;
    });
  }

  // A player buyin play chips for the current game (either for the first time or adding on his existing stack)
  async playerBuyIn(player: PlayerInGame, amount: number): Promise<boolean> {
    return await this._TableConditionChangeMutex.runExclusive(async () => {
      if (player.getStack() + amount > this.getTableConfig().maxBuyin)
        return false;
      if (this._gameFlowManager) {
        // if in a running game - set an event for the end of the current hand to add players chips
        this._stacksUpdatesForNextHand.push([player, amount]);
      } else {
        // otherwise, add the buyin chips right away
        player.updatePlayerPublicState({
          currentStack: player.getStack() + amount,
        });
        // and check if the game is ready to start
        const afterFunction = this.isReadyForNextHand()
          ? this.startGame.bind(this) // start game if ready, the updated stack will be broadcasted in the first game broadcast.
          : this.updateGameStateAndBroadcast.bind(this, {}, null); // otherwise update players with the buyin chips.
        setImmediate(afterFunction);
      }
      return true;
    });
  }

  dealRivers(): Card[] {
    return this._deck!.getRivers();
  }
  dealTurns(): Card[] {
    return this._deck!.getTurns();
  }
  dealFlops(): Card[][] {
    return this._deck!.getFlops();
  }

  getStatus() {
    return this._state.phase;
  }

  getId() {
    return this._state.id;
  }

  getStakes() {
    return this._state.stakes;
  }

  async handleGameStateRequest(player: Player): Promise<boolean> {
    const sittingPlayer = this.getPlayer(player.getId()); // if player is PlayerInGame
    const success = await this._broadcaster.broadcastCachedState(
      sittingPlayer || player
    );
    return success;
  }

  private getObserversProperty<T>(
    propertyExtractor: (player: Player) => T
  ): T[] {
    return Array.from(this._state.observers).map(propertyExtractor);
  }

  getObserversNames(): string[] {
    return this.getObserversProperty((player) => player.getName());
  }

  getObserversSockets(): string[] {
    return this.getObserversProperty((player) => player.getSocketId());
  }

  getPlayerInPosition(position: Position): PlayerInGame | null {
    return this._state.playerInPosition?.get(position) || null;
  }

  // Accsess to players who got dealt into the current hand
  getPlayersInGame(): Map<Position, PlayerInGame | null> | null {
    return this._state.playerInPosition;
  }

  // Allows additional access (relative to getPlayersInGame()) to all seating players, including new and sitting-out player
  getPlayersBySeat(): Array<PlayerInGame | null> {
    return this._state.playersAbsolutePosition;
  }

  getPotSize(): number {
    return this._state.potSize;
  }

  getPhase(): GamePhase {
    return this._state?.phase;
  }

  getFlops(): Card[][] {
    return this._state.flops;
  }
  getTurns(): Card[] {
    return this._state.turns;
  }
  getRivers(): Card[] {
    return this._state.rivers;
  }

  getTableConfig() {
    return this._state.tableConfig;
  }
  getBettingState() {
    return this._state.bettingState;
  }

  handleHandWonWithoutShowdown(winner: PlayerInGame) {
    this._isHandWonWithoutShowdown = true;
    winner.updatePlayerPublicState({
      currentStack: winner.getStack() + this._state.potSize,
    });
    this._state.potSize = 0;
    //todo update stacks, pot, ect
  }

  isHandWonWithoutShowdown() {
    return this._isHandWonWithoutShowdown;
  }

  getArrangePlayerCardsState(): ArrangePlayerCardsState | null {
    return this._state.arrangePlayerCardsState;
  }

  doShowdown() {
    this._state.phase = GamePhase.Showdown;
    //todo
  }

  getServer() {
    return this._server;
  }

  getPotManager() {
    return this._potManager;
  }

  getGameFlowManager(): SingleGameFlowManager | null {
    return this._gameFlowManager;
  }

  isReadyForNextHand(): boolean {
    const minStackRequired =
      this._state.tableConfig.bbAmount *
      (Number(process.env.MIN_BB_TO_PLAY_HAND) || 1);
    const activePlayers = Array.from(
      this._state.playersAbsolutePosition.values()
    ).filter((player) => player?.isReadyToStartHand(minStackRequired)).length;
    return activePlayers >= this._state.tableConfig.minPlayers;
  }

  getPlayer(playerId: string): PlayerInGame | null {
    return (
      this._state.playersAbsolutePosition.find(
        (player) => player?.getId() === playerId
      ) ?? null
    );
  }
}
