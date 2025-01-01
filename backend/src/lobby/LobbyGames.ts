import { Player } from '../player/Player';

interface Game {
  id: string;
  players: Player[];
  bigBlind: number;
  smallBlind: number;
  status: 'waiting' | 'started';
}

interface GameQueue {
  queue: Player[];
  games: Game[];
}

export const gamesByBlinds: Record<string, GameQueue> = {
  '5-10': { queue: [], games: [] },
  '10-20': { queue: [], games: [] },
  '25-50': { queue: [], games: [] },
};

export const createGame = (blindLevel: string, players: Player[]): Game => {
  const [smallBlind, bigBlind] = blindLevel.split('-').map(Number);
  return {
    id: require('crypto').randomUUID(),
    players,
    smallBlind,
    bigBlind,
    status: 'started',
  };
};
