// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { DetailedGameState, GamePhase } from './types/GameState';
import { PlayerInGame } from './types/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';
import {
  Position,
  rotatePositionsAndSetupPlayerState,
} from './utils/PositionsUtils';
import { Deck } from './types/Deck';
import { TableConfig } from './betting/BettingTypes';
import { ArrangePlayerCardsState } from './arrangeCards/ArrangePlayerCardsManager';
import { SingleGameFlowManager } from './utils/SingleGameFlowManager';
import { Mutex } from 'async-mutex';

export class Game {
  private deck: Deck | null;
  private state: DetailedGameState;
  private broadcaster: GameStateBroadcaster;
  private handWonWithoutShowdown: boolean;
  private server: Server;
  private gameFlowManager: SingleGameFlowManager | null;
  private stacksUpdatesForNextHand: Array<[PlayerInGame, number]>;
  private TableConditionChangeMutex: Mutex;

  constructor(
    id: string,
    stakes: string,
    server: Server,
    tableConfig: TableConfig
  ) {
    this.server = server;
    this.broadcaster = new GameStateBroadcaster(server);
    this.TableConditionChangeMutex = new Mutex();
    this.handWonWithoutShowdown = false;
    this.state = {
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
    this.deck = null;
    this.gameFlowManager = null;
    this.stacksUpdatesForNextHand = new Array<[PlayerInGame, number]>();
  }

  /*
  return true if ready to start next hand
   false if not, and keep waiting state until recived new active player (join/rebuy/marked-ready)
  */
  PrepareNextHand() {
    this.handWonWithoutShowdown = false;
    this.state = {
      ...this.state,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      potSize: 0,
    };
    this.TableConditionChangeMutex.runExclusive(async () => {
      rotatePositionsAndSetupPlayerState(
        this.state.playerInPosition!,
        this.state
      );
      this.stacksUpdatesForNextHand.forEach(([player, amount]) => {
        player.updatePlayerPublicState({
          currentStack: player.getStack() + amount,
        });
        player.isReadyToStartHand;
      });
    });
  }

  dealNewHand() {
    this.deck = new Deck();
    this.state.phase = GamePhase.PreflopBetting;
    this.state.playerInPosition!.forEach(player => {
      // As for now, player can only play a hand with >= 1BB stack
      if (player?.isActive()) {
        player.updatePlayerPrivateState({ cards: this.deck!.getPlayerCards() }); // update
      }
    });
  }

  updateGameStateAndBroadcast(
    updates: Partial<DetailedGameState>,
    afterFunction: (() => void) | null
  ) {
    if (updates) this.state = { ...this.state, ...updates };
    this.broadcaster.broadcastGameState(this, afterFunction);
  }

  async startGame() {
    this.TableConditionChangeMutex.runExclusive(async () => {
      if (this.gameFlowManager) return;
      this.gameFlowManager = new SingleGameFlowManager(this);
      setImmediate(() => this.gameFlowManager?.startNextStreet());
    });
  }

  addObserver(player: Player) {
    this.TableConditionChangeMutex.runExclusive(async () => {
      if (!this.state.observers.some(observer => observer === player)) {
        this.state.observers.push(player); // broadcast?
      }
    });
  }

  async addPlayer(player: Player, position: Position): Promise<boolean> {
    return this.TableConditionChangeMutex.runExclusive(async () => {
      // Check if the position is available
      if (
        this.state.playerInPosition!.has(position) ||
        this.state.playerInPosition!.get(position) != null
      )
        return false;

      const playerInGame = new PlayerInGame(player, this, position);
      this.state.playerInPosition!.set(position, playerInGame);

      //Remove player as an observers
      this.state.observers = this.state.observers.filter(
        obs => obs.getId() !== player.getId()
      );

      setImmediate(() => this.updateGameStateAndBroadcast({}, null));
      return true;
    });
  }

  async playerBuyIn(player: PlayerInGame, amount: number) {
    this.TableConditionChangeMutex.runExclusive(async () => {
      // if in a running game - set an even for the end of the current hand to add players chips
      if (this.gameFlowManager) {
        this.stacksUpdatesForNextHand.push([player, amount]);
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
    return this.deck!.getRivers();
  }
  dealTurns(): Card[] {
    return this.deck!.getTurns();
  }
  dealFlops(): Card[][] {
    return this.deck!.getFlops();
  }

  getStatus() {
    return this.state.phase;
  }

  getId() {
    return this.state.id;
  }

  getStakes() {
    return this.state.stakes;
  }

  getObserversNames(): String[] {
    return this.state.observers.map((observer: Player) => observer.getName());
  }

  getPlayerInPosition(position: Position): PlayerInGame | null {
    return this.state.playerInPosition?.get(position) || null;
  }

  getPlayersInGame(): Map<Position, PlayerInGame | null> | null {
    return this.state.playerInPosition;
  }

  getPotSize(): number {
    return this.state.potSize;
  }

  getPhase(): GamePhase {
    return this.state?.phase;
  }

  getFlops(): Card[][] {
    return this.state.flops;
  }
  getTurns(): Card[] {
    return this.state.turns;
  }
  getRivers(): Card[] {
    return this.state.rivers;
  }

  getTableConfig() {
    return this.state.tableConfig;
  }
  getBettingState() {
    return this.state.bettingState;
  }

  getObserversList(): Player[] {
    return this.state.observers;
  }

  handleHandWonWithoutShowdown(winner: PlayerInGame) {
    this.handWonWithoutShowdown = true;
    winner.updatePlayerPublicState({
      currentStack: winner.getStack() + this.state.potSize,
    });
    this.state.potSize = 0;
    //todo update stacks, pot, ect
  }

  isHandWonWithoutShowdown() {
    return this.handWonWithoutShowdown;
  }

  getArrangePlayerCardsState(): ArrangePlayerCardsState | null {
    return this.state.arrangePlayerCardsState;
  }

  doShowdown() {
    this.state.phase = GamePhase.Showdown;
    //todo
  }

  getServer() {
    return this.server;
  }

  getGameFlowManager(): SingleGameFlowManager | null {
    return this.gameFlowManager;
  }

  isReadyForNextHand(): boolean {
    const minStackRequired =
      this.state.tableConfig.bbAmount *
      (Number(process.env.MIN_BB_TO_PLAY_HAND) || 1);
    const activePlayers = Array.from(
      this.state.playerInPosition.values()
    ).filter(player => player?.isReadyToStartHand(minStackRequired)).length;
    return activePlayers >= this.state.tableConfig.minPlayers;
  }

  getPlayer(playerId: string): PlayerInGame | null {
    for (const [, player] of this.state.playerInPosition ?? []) {
      if (player?.getId() === playerId) return player;
    }
    return null;
  }
}
