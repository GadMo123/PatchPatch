// src/game/Game.ts - Represents a single game object.

import { Server } from "socket.io";
import { Player } from "../player/Player";
import { DetailedGameState, GamePhase } from "./types/GameState";
import { PlayerInGame } from "./types/PlayerInGame";
import { GameStateBroadcaster } from "./broadcasting/GameStateBroadcaster";

import { Deck } from "./types/Deck";
import { TableConfig } from "./betting/BettingTypes";
import { ArrangePlayerCardsState } from "./arrangeCards/ArrangePlayerCardsManager";
import { SingleGameFlowManager } from "./utils/SingleGameFlowManager";
import { Mutex } from "async-mutex";
import { Card, NoShowdownResultClientData, Position } from "@patchpatch/shared";
import {
  assignPositions,
  RotateButtonPosition,
} from "./utils/PokerPositionsUtils";
import { PotManager } from "./utils/PotUtils/PotManager";
import { PotContribution } from "./utils/PotUtils/PotContribution";
import { ShowdownManager } from "./showdown/ShowdownManager";

export class Game {
  private _deck: Deck | null;
  private _state: DetailedGameState;
  private _broadcaster: GameStateBroadcaster;
  private _isHandWonWithoutShowdown: boolean;
  private _potManager: PotManager;
  private _gameFlowManager: SingleGameFlowManager | null;
  private _stacksUpdatesForNextHand: Array<[PlayerInGame, number]>;
  private _TableConditionChangeMutex: Mutex; // For any async changes in table resources such as positions, seats ect.
  private _playersToRemoveAfterHand: string[];
  private _playersSitoutNextHand: Set<PlayerInGame>;
  private _lastBtnAbsPosition: number | null | undefined;

  constructor(
    id: string,
    private _server: Server,
    tableConfig: TableConfig
  ) {
    this._server = _server;
    this._potManager = new PotManager(new PotContribution());
    this._broadcaster = new GameStateBroadcaster(_server);
    this._TableConditionChangeMutex = new Mutex();
    this._isHandWonWithoutShowdown = false;
    this._playersToRemoveAfterHand = [];
    this._playersSitoutNextHand = new Set();
    this._state = {
      id,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      observers: new Set<Player>(),
      playerInPosition: new Map<Position, PlayerInGame | null>(),
      playersAbsolutePosition: new Array<PlayerInGame | null>(
        tableConfig.maxPlayers
      ).fill(null),
      tableConfig: tableConfig,
      bettingState: null,
      arrangePlayerCardsState: null,
      potsWinners: null,
      showdownResults: null,
      noShowdownResults: null,
    };
    this._deck = null;
    this._gameFlowManager = null;
    this._stacksUpdatesForNextHand = new Array<[PlayerInGame, number]>();
  }

  async cleanupHand() {
    this._potManager = new PotManager(new PotContribution());
    this._isHandWonWithoutShowdown = false;
    this._state = {
      ...this._state,
      potsWinners: null,
      flops: [],
      turns: [],
      rivers: [],
      arrangePlayerCardsState: null,
      bettingState: null,
      showdownResults: null,
      noShowdownResults: null,
    };
    Array.from(this._state.playerInPosition.values()).forEach((player) =>
      player?.updatePlayerPrivateState({ cards: undefined })
    );
    // removed players list - replace with null for empty seat to keep the mechanism of playersAbsolutePosition
    this._state.playersAbsolutePosition =
      this._state.playersAbsolutePosition.map((player) =>
        player && this._playersToRemoveAfterHand.includes(player.getId())
          ? null
          : player
      );
    this._playersToRemoveAfterHand = [];
    this._playersSitoutNextHand.forEach((player) => player.toggleSitOut(true));
    this._playersSitoutNextHand = new Set();
  }

  async PrepareNextHand(): Promise<boolean> {
    await this.cleanupHand(); // keep out of _TableConditionChangeMutex since it use the mutex as well!
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
        (player): player is PlayerInGame =>
          !!player &&
          player.isReadyToStartHand(this._state.tableConfig.bbAmount)
      );

      // Players map can change between the check of number of ready players (which runs async with players actions such as sitting out)
      // in this case we have to stop hand praperation and go into waiting mode.
      if (nextHandPlayers.length < this._state.tableConfig.minPlayers) {
        this._state.phase = GamePhase.Waiting;
        return false; // Releases lock and signal game flow manager to wait for players.
      }

      const nextHandBtnPlayer = RotateButtonPosition(
        this._lastBtnAbsPosition,
        nextHandPlayers
      );

      // Save the btn player absolute position for next hand btn rotation
      this._lastBtnAbsPosition = nextHandBtnPlayer.getTablePosition();

      console.log("new hand button " + nextHandBtnPlayer.getName());
      this._state.playerInPosition = assignPositions(
        nextHandPlayers,
        nextHandBtnPlayer.getId()
      );

      // Reset all players' states for the next hand
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

  async removePlayer(player: PlayerInGame) {
    const playerId = player.getId();
    let playerInCurrentHand = false;
    this._TableConditionChangeMutex.runExclusive(async () => {
      if (this._state.phase !== GamePhase.Waiting) {
        for (const [_, activePlayer] of this._state.playerInPosition) {
          if (activePlayer && activePlayer.getId() === playerId) {
            playerInCurrentHand = true;
            break;
          }
        }
      }
      if (playerInCurrentHand) {
        // add player to remove list after the current hand
        this._playersToRemoveAfterHand.push(playerId);
        // set player folded when leave in mid-hand
        player.updatePlayerPublicState({ isFolded: true });
      } else {
        this._state.playersAbsolutePosition =
          this._state.playersAbsolutePosition.map((player) =>
            player?.getId() === playerId ? null : player
          );
        setImmediate(() => this.updateGameStateAndBroadcast({}, null));
      }
    });
  }

  // A player buyin play chips for the current game (either for the first time or adding on his existing stack)
  async playerBuyIn(player: PlayerInGame, amount: number): Promise<boolean> {
    return await this._TableConditionChangeMutex.runExclusive(async () => {
      // Player already added buyin this round, only one buying is allowed per hand (main reason is to not allow player to buy over max table limit, tho it could be solved differently, it's a fine limitation reduce spam requests)
      if (
        this._stacksUpdatesForNextHand.some(
          ([existingPlayer]) => existingPlayer === player
        )
      )
        return false;
      if (player.getStack() + amount > this.getTableConfig().maxBuyin)
        return false;
      // Todo - reduce player coins once database added
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

  enterRestMode() {
    this._TableConditionChangeMutex.runExclusive(async () => {
      this._gameFlowManager = null;
      this.cleanupHand();
      this._state.phase = GamePhase.Waiting;
      console.log("waiting mode entered");
    });
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

  // main pot is always first in the array.
  getPotSizes(): number[] | null {
    return this._potManager.getPotsSizes();
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

  getShowdownState(): import("./types/GameState").ShowdownResult | null {
    return this._state.showdownResults ?? null;
  }

  async FindHandWinnerWithoutShowdown(): Promise<PlayerInGame | null> {
    let winner: PlayerInGame | null = null;
    let standingPlayers = 0;

    for (const player of this._state.playerInPosition.values()) {
      if (player && !player.isFolded()) {
        winner = player;
        standingPlayers++;
        if (standingPlayers > 1) return null; // More than one standing player, no winner
      }
    }

    if (standingPlayers === 1 && winner !== null) {
      // Wait for the handleHandWonWithoutShowdown to complete before returning the winner
      await this.handleHandWonWithoutShowdown(winner);
    }

    if (standingPlayers === 0) {
      console.error("checkIfHandWonWithoutShowdown - no players standing");
    }

    return winner;
  }

  async handleHandWonWithoutShowdown(winner: PlayerInGame) {
    console.log("handleHandWonWithoutShowdown");
    this._isHandWonWithoutShowdown = true;
    const totalPotsSize = this._potManager.getPotsSizes();
    if (totalPotsSize) {
      const totalWinAmount = totalPotsSize.reduce((sum, pot) => sum + pot, 0); // Sum all pots
      this._state.potsWinners = new Map([[winner.getId(), totalWinAmount]]);
      const currentStack = winner.getStack();
      winner.updatePlayerPublicState({
        currentStack: currentStack + totalWinAmount,
      });
    }
    this._state.noShowdownResults = {
      animationTime: this._state.tableConfig.noShowDwonAnimationTime,
      potAmount: totalPotsSize
        ? totalPotsSize.reduce((sum, pot) => sum + pot, 0)
        : 0,
      winnerId: winner.getId(),
    };
    this._state.phase = GamePhase.StartingHand;
  }

  async playerSitoutNextHandRequest(player: PlayerInGame, sitout: boolean) {
    this._TableConditionChangeMutex.runExclusive(async () => {
      if (this._state.phase === GamePhase.Waiting) {
        player.toggleSitOut(sitout);
        if (!sitout) setImmediate(() => this.startGame()); // check if game is ready to start
      } else {
        if (sitout && !player.isSittingOut())
          this._playersSitoutNextHand.add(player);
        if (!sitout) {
          this._playersSitoutNextHand.delete(player);
          player.toggleSitOut(false);
        }
      }
    });
  }

  isHandWonWithoutShowdown() {
    return this._isHandWonWithoutShowdown;
  }

  getArrangePlayerCardsState(): ArrangePlayerCardsState | null {
    return this._state.arrangePlayerCardsState;
  }

  getNoShowdownState(): NoShowdownResultClientData | null {
    return this._state.noShowdownResults;
  }

  getNoSDAnimationTime() {
    return this._state.tableConfig.noShowDwonAnimationTime;
  }

  doShowdown(afterShowdown: () => Promise<void>) {
    this._state.phase = GamePhase.Showdown;
    new ShowdownManager(this, this._state, this._potManager, afterShowdown);
  }

  getServer() {
    return this._server;
  }

  getPotsWinners() {
    return this._state.potsWinners;
  }

  getPotManager() {
    return this._potManager;
  }

  removeObserver(player: Player) {
    this._state.observers.delete(player);
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
