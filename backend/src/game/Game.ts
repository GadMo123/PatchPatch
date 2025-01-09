// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { DetailedGameState, GamePhase, PlayerState } from './types/GameState';
import { PlayerInGame } from '../player/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';

export class Game {
  handWonWithoutShowdown(winner: PlayerInGame) {
    throw new Error('Method not implemented.');
  }
  private state: DetailedGameState;

  constructor(id: string, stakes: string, server: Server) {
    this.state = {
      id,
      stakes,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      observers: [],
      potSize: 0,
      bbPlayer: null,
      sbPlayer: null,
      bettingRound: null,
    };
  }

  // State update methods
  updateGameState(updates: Partial<DetailedGameState>) {
    this.state = { ...this.state, ...updates };
    this.broadcastGameState();
  }

  updatePlayerState(playerId: string, updates: Partial<PlayerState>) {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    this.state.players[playerIndex] = {
      ...this.state.players[playerIndex],
      ...updates,
    };
    this.broadcastGameState();
  }

  // State access methods
  getDetailedGameState(viewingPlayerId?: string): DetailedGameState {
    // Clone state to avoid direct mutations
    const state = JSON.parse(JSON.stringify(this.state));

    // Hide private information for observers
    if (!viewingPlayerId) {
      state.players = state.players.map(player => ({
        ...player,
        cards: undefined,
        arrangedCards: undefined,
      }));
      return state;
    }

    // Hide other players' private cards
    state.players = state.players.map(player => ({
      ...player,
      cards: player.id === viewingPlayerId ? player.cards : undefined,
      arrangedCards:
        player.id === viewingPlayerId ? player.arrangedCards : undefined,
    }));

    return state;
  }

  // todo, turn observer into a player
  addObserver(player: Player) {
    this.state.observers.push(player);
  }

  addPlayer(player: Player, buyIn: number) {
    // todo, handle Error('Game is full');
    const playerInGame = new PlayerInGame(player, this);
    playerInGame.currentStack = buyIn; // Todo, buyin Logic, database, reduce for coind, ect.
    // Assign player's position
    if (!this.state.smallBlindPlayer)
      this.state.smallBlindPlayer = playerInGame; // first player to join enjoy the btn position advantage for now
    else this.state.bigBlindPlayer = playerInGame;
    this.observers = this.observers.filter(other => other.id !== player.id); //Remove player as an observer
  }

  startGame() {
    if (!this.state.smallBlindPlayer || !this.state.bigBlindPlayer)
      throw new Error('Not enough players to start a game');

    this.state.phase = GamePhase.PreflopBetting;

    this.state.bigBlindPlayer!.cards = this.deck.getPlayerCards();
    this.state.smallBlindPlayer!.cards = this.deck.getPlayerCards();
    this.broadcastGameState();
  }

  dealFlops() {
    this.state.flops = this.deck.getFlops();
    this.state.phase = GamePhase.FlopDealt;
    this.broadcastGameState();
  }

  dealTurn() {
    this.state.turns = this.deck.getTurns();
    this.state.phase = GamePhase.TurnDealt;
    this.broadcastGameState();
  }

  dealRiver() {
    this.state.rivers = this.deck.getRivers();
    this.state.phase = GamePhase.RiverDealt;
    this.broadcastGameState();
  }

  endGame() {
    this.state.phase = GamePhase.Showdown;
    this.broadcastGameState();
  }

  broadcastGameState() {
    this.broadcaster.broadcastGameState(this);
  }

  getPublicGameState() {
    // use for observers
    return {
      id: this.id,
      flops: this.state.flops,
      turns: this.state.turns,
      rivers: this.state.rivers,
      phase: this.state.phase,
      potSize: this.state.potSize,
      smallBlindPlayer: this.state.smallBlindPlayer,
      bigBlindPlayer: this.state.bigBlindPlayer,
      observers: this.observers.map(player => ({
        name: player.name,
      })),
    };
  }

  getPersonalizedGameState(playerId: string) {
    return {
      id: this.id,
      flops: this.state.flops,
      turns: this.state.turns,
      rivers: this.state.rivers,
      status: this.state.phase,
      potSize: this.state.potSize, // Include the pot size
      players: this.observers.map(player => ({
        id: player.id,
        name: player.name,
      })),
      playersInGame: [this.state.bigBlindPlayer, this.state.smallBlindPlayer]
        .filter(player => player !== null) // Ensure only valid players are included
        .map(player => ({
          id: player!.id,
          name: player!.name,
          stack: player!.currentStack, // Include their current stack
          cards: player!.id === playerId ? player!.cards : [], // Include private cards only for the requesting player
        })),
    };
  }

  getStatus() {
    return this.state.phase;
  }

  getId() {
    return this.id;
  }

  getStakes() {
    return this.stakes;
  }

  getObserversList(): Player[] {
    return this.state.observers;
  }

  getPotSize(): number {
    return this.state.potSize;
  }

  getPhase(): GamePhase {
    return this.state?.phase;
  }

  getBigBlindPlayer(): PlayerInGame | null {
    return this.state?.bigBlindPlayer;
  }

  getSmallBlindPlayer(): PlayerInGame | null {
    return this.state?.smallBlindPlayer;
  }

  getBroadcaster() {
    return this.broadcaster;
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
}
