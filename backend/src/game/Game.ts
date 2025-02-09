// src/game/Game.ts - Represents a single game object.

import { Server } from "socket.io";
import { Player } from "../player/Player";
import { DetailedGameState, GamePhase } from "./broadcasting/GameState";
import { PlayerInGame } from "./types/PlayerInGame";
import { GameStateBroadcaster } from "./broadcasting/GameStateBroadcaster";

import { rotatePositionsAndSetupPlayerState } from "./utils/PositionsUtils";
import { Deck } from "./types/Deck";
import { TableConfig } from "./betting/BettingTypes";
import { ArrangePlayerCardsState } from "./arrangeCards/ArrangePlayerCardsManager";
import { SingleGameFlowManager } from "./utils/SingleGameFlowManager";
import { Mutex } from "async-mutex";
import { Card, Position } from "shared";

export class Game {
  private _deck: Deck | null;
  private _state: DetailedGameState;
  private _broadcaster: GameStateBroadcaster;
  private _handWonWithoutShowdown: boolean;
  private _gameFlowManager: SingleGameFlowManager | null;
  private _stacksUpdatesForNextHand: Array<[PlayerInGame, number]>;
  private _TableConditionChangeMutex: Mutex;

  constructor(
    id: string,
    stakes: string,
    private _server: Server,
    tableConfig: TableConfig
  ) {
    this._server = _server;
    this._broadcaster = new GameStateBroadcaster(_server);
    this._TableConditionChangeMutex = new Mutex();
    this._handWonWithoutShowdown = false;
    this._state = {
      id,
      stakes,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      observers: [],
      potSize: 0,
      playerInPosition: new Map<Position, PlayerInGame | null>(),
      tableConfig: tableConfig,
      bettingState: null,
      arrangePlayerCardsState: null,
    };
    this._deck = null;
    this._gameFlowManager = null;
    this._stacksUpdatesForNextHand = new Array<[PlayerInGame, number]>();
  }

  /*
  return true if ready to start next hand
   false if not, and keep waiting state until recived new active player (join/rebuy/marked-ready)
  */
  PrepareNextHand() {
    this._handWonWithoutShowdown = false;
    this._state = {
      ...this._state,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      potSize: 0,
    };
    this._TableConditionChangeMutex.runExclusive(async () => {
      rotatePositionsAndSetupPlayerState(
        this._state.playerInPosition!,
        this._state
      );
      this._stacksUpdatesForNextHand.forEach(([player, amount]) => {
        player.updatePlayerPublicState({
          currentStack: player.getStack() + amount,
        });
        player.isReadyToStartHand;
      });
    });
  }

  dealNewHand() {
    this._deck = new Deck();
    this._state.phase = GamePhase.PreflopBetting;
    this._state.playerInPosition!.forEach((player) => {
      // As for now, player can only play a hand with >= 1BB stack
      if (player?.isActive()) {
        player.updatePlayerPrivateState({
          cards: this._deck!.getPlayerCards(),
        }); // update
      }
    });
  }

  updateGameStateAndBroadcast(
    updates: Partial<DetailedGameState>,
    afterFunction: (() => void) | null
  ) {
    if (updates) this._state = { ...this._state, ...updates };
    this._broadcaster.broadcastGameState(this, afterFunction);
  }

  async startGame() {
    this._TableConditionChangeMutex.runExclusive(async () => {
      if (this._gameFlowManager) return;
      this._gameFlowManager = new SingleGameFlowManager(this);
      setImmediate(() => this._gameFlowManager?.startNextStreet());
    });
  }

  async addObserver(player: Player) {
    this._TableConditionChangeMutex.runExclusive(async () => {
      if (!this._state.observers.some((observer) => observer === player)) {
        this._state.observers.push(player); // broadcast?
      }
    });
  }

  async addPlayer(player: Player, position: Position): Promise<boolean> {
    return this._TableConditionChangeMutex.runExclusive(async () => {
      // Check if the position is available
      if (
        this._state.playerInPosition!.has(position) ||
        this._state.playerInPosition!.get(position) != null
      )
        return false;

      const playerInGame = new PlayerInGame(player, this, position);
      this._state.playerInPosition!.set(position, playerInGame);

      //Remove player as an observers
      this._state.observers = this._state.observers.filter(
        (obs) => obs.getId() !== player.getId()
      );

      setImmediate(() => this.updateGameStateAndBroadcast({}, null));
      return true;
    });
  }

  async playerBuyIn(player: PlayerInGame, amount: number) {
    this._TableConditionChangeMutex.runExclusive(async () => {
      // if in a running game - set an even for the end of the current hand to add players chips
      if (this._gameFlowManager) {
        this._stacksUpdatesForNextHand.push([player, amount]);
      } else {
        // otherwise, add the buyin chips right away
        player.updatePlayerPublicState({
          currentStack: player.getStack() + amount,
        });
        const afterFunction = this.isReadyForNextHand()
          ? this.startGame.bind(this) // start game if ready, the updated stack will be broadcasted in the first game broadcast.
          : this.updateGameStateAndBroadcast.bind(this, {}, null); // otherwise update players with the buyin chips.
        setImmediate(afterFunction);
      }
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

  getObserversNames(): String[] {
    return this._state.observers.map((observer: Player) => observer.getName());
  }

  getPlayerInPosition(position: Position): PlayerInGame | null {
    return this._state.playerInPosition?.get(position) || null;
  }

  getPlayersInGame(): Map<Position, PlayerInGame | null> | null {
    return this._state.playerInPosition;
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

  getObserversList(): Player[] {
    return this._state.observers;
  }

  handleHandWonWithoutShowdown(winner: PlayerInGame) {
    this._handWonWithoutShowdown = true;
    winner.updatePlayerPublicState({
      currentStack: winner.getStack() + this._state.potSize,
    });
    this._state.potSize = 0;
    //todo update stacks, pot, ect
  }

  isHandWonWithoutShowdown() {
    return this._handWonWithoutShowdown;
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

  getGameFlowManager(): SingleGameFlowManager | null {
    return this._gameFlowManager;
  }

  isReadyForNextHand(): boolean {
    const minStackRequired =
      this._state.tableConfig.bbAmount *
      (Number(process.env.MIN_BB_TO_PLAY_HAND) || 1);
    const activePlayers = Array.from(
      this._state.playerInPosition.values()
    ).filter((player) => player?.isReadyToStartHand(minStackRequired)).length;
    return activePlayers >= this._state.tableConfig.minPlayers;
  }

  getPlayer(playerId: string): PlayerInGame | null {
    for (const [, player] of this._state.playerInPosition ?? []) {
      if (player?.getId() === playerId) return player;
    }
    return null;
  }
}
