// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { DetailedGameState, GamePhase } from './types/GameState';
import { PlayerInGame } from './types/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';
import { Position } from './utils/PositionsUtils';
import { Deck } from './types/Deck';
import { BettingConfig } from './betting/BettingTypes';
import { PositionLock } from './types/PositionLock';
import { ArrangePlayerCardsState } from './arrangeCards/ArrangePlayerCardsManager';
import { SingleGameFlowManager } from './utils/SingleGameFlowManager';
import { BettingManager } from './betting/BettingManager';

export class Game {
  private deck: Deck | null;
  private state: DetailedGameState;
  private broadcaster: GameStateBroadcaster;
  private positionLock: PositionLock;
  private handWonWithoutShowdown: boolean;
  private server: Server;
  private gameFlowManager: SingleGameFlowManager | null;

  constructor(
    id: string,
    stakes: string,
    server: Server,
    tableBettingConfig: BettingConfig
  ) {
    this.server = server;
    this.broadcaster = new GameStateBroadcaster(server);
    this.positionLock = new PositionLock();
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
      bettingConfig: tableBettingConfig,
      bettingState: null,
      arrangePlayerCardsState: null,
    };
    this.deck = null;
    this.gameFlowManager = null;
  }

  dealNewHand() {
    this.handWonWithoutShowdown = false;
    this.deck = new Deck();
    this.state.phase = GamePhase.PreflopBetting;
    this.state.potSize = 0; //todo take blinds
    this.state.playerInPosition!.forEach(player => {
      if (player) {
        const cards = this.deck!.getPlayerCards(); // deal player's cards
        player.updatePlayerPrivateState({ cards }); // update
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

  startGame() {
    this.gameFlowManager = new SingleGameFlowManager(this);
    this.gameFlowManager.startNextStreet();
  }

  addObserver(player: Player) {
    if (!this.state.observers.some(observer => observer === player)) {
      this.state.observers.push(player); // broadcast?
    }
  }

  addPlayer(player: Player, buyIn: number, position: Position): boolean {
    // Check if the position is available
    if (
      this.state.playerInPosition!.has(position) ||
      this.state.playerInPosition!.get(position) != null
    )
      return false;

    const playerInGame = new PlayerInGame(player, this, position, buyIn);
    this.state.playerInPosition!.set(position, playerInGame);

    //Remove player as an observers
    this.state.observers = this.state.observers.filter(
      obs => obs.id !== player.id
    );

    this.updateGameStateAndBroadcast({}, null);
    return true;
  }

  dealRivers(): Card[] | undefined {
    return this.deck?.getRivers();
  }
  dealTurns(): Card[] | undefined {
    return this.deck?.getTurns();
  }
  dealFlops(): Card[][] | undefined {
    return this.deck?.getFlops();
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

  getPositionLock(): PositionLock {
    return this.positionLock;
  }

  getObserversNames(): String[] {
    return this.state.observers.map((observer: Player) => observer.name);
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

  getBettingConfig() {
    return this.state.bettingConfig;
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

  getGameFlowManager(): SingleGameFlowManager {
    if (!this.gameFlowManager) throw new Error('Game is not running');
    return this.gameFlowManager;
  }

  isReadyForNextHand(): boolean {
    //Todo
    return (
      this.getPlayerInPosition(Position.SB) != null &&
      this.getPlayerInPosition(Position.BB) != null
    );
  }
}
