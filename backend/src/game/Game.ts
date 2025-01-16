// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { DetailedGameState, GamePhase } from './types/GameState';
import { PlayerInGame } from './types/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';
import { Position } from './types/PositionsUtils';
import { Deck } from './types/Deck';
import { BettingConfig } from './betting/BettingTypes';
import { BettingManager } from './betting/BettingManager';
import { PositionLock } from './types/PositionLock';
import { SingleGameManager } from '../gameFlowManager/SingleGameManager';

export class Game {
  setGameFlowManager(manager: SingleGameManager) {
    this.gameFlowManager = manager;
  }

  onBettingRoundComplete() {
    this.updateGameStateAndBroadcast({ bettingState: null }, null);
    this.gameFlowManager!.onBettingRoundComplete();
  }

  private gameFlowManager: SingleGameManager | null;
  private state: DetailedGameState;
  private broadcaster: GameStateBroadcaster;
  private deck: Deck | null;
  private positionLock: PositionLock;
  private handWonWithoutShowdown: boolean;

  constructor(
    id: string,
    stakes: string,
    server: Server,
    tableBettingConfig: BettingConfig
  ) {
    this.gameFlowManager = null;
    this.broadcaster = new GameStateBroadcaster(server);
    this.deck = null;
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
    };
  }

  updateGameStateAndBroadcast(
    updates: Partial<DetailedGameState>,
    afterFunction: (() => void) | null
  ) {
    this.state = { ...this.state, ...updates };
    this.broadcastGameState(afterFunction);
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

    this.broadcastGameState(null);
    return true;
  }

  startGame() {
    // Todo check and rearrange positions if needed
    this.handWonWithoutShowdown = false;
    this.deck = new Deck();
    this.state.phase = GamePhase.PreflopBetting;
    this.state.playerInPosition!.forEach(player => {
      if (player) {
        const cards = this.deck!.getPlayerCards(); // deal player's cards
        player.updatePlayerPrivateState({ cards }); // update
      }
    });
    this.broadcastGameState(this.startBettingRound.bind(this)); // Start betting round once players recived cards
  }

  startBettingRound() {
    const bettingManager = new BettingManager(
      this,
      this.state.bettingConfig,
      this.gameFlowManager!.onBettingRoundComplete
    );
  }

  dealFlops() {
    this.updateGameStateAndBroadcast(
      {
        flops: this.deck!.getFlops(),
        phase: GamePhase.FlopBetting,
      },
      this.startBettingRound.bind(this)
    );
  }

  dealTurn() {
    this.updateGameStateAndBroadcast(
      {
        turns: this.deck!.getTurns(),
        phase: GamePhase.TurnBetting,
      },
      this.startBettingRound.bind(this)
    );
  }

  dealRiver() {
    this.updateGameStateAndBroadcast(
      {
        rivers: this.deck!.getRivers(),
        phase: GamePhase.RiverBetting,
      },
      this.startBettingRound.bind(this)
    );
    // Todo : start cacl winner right here as a microservice to find the winner by the time of showdown
  }

  broadcastGameState(afterFunction: (() => void) | null) {
    this.broadcaster.broadcastGameState(this, afterFunction);
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
  }

  isHandWonWithoutShowdown() {
    return this.handWonWithoutShowdown;
  }

  doShowdown(afterShowdown: () => void) {
    this.state.phase = GamePhase.Showdown;
  }

  isReadyForNextHand(): boolean {
    //Todo
    return (
      this.getPlayerInPosition(Position.SB) != null &&
      this.getPlayerInPosition(Position.BB) != null
    );
  }
}
