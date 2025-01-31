import { Card, isValidRank, isValidSuit } from '../types/Card';
import { PlayerInGame } from '../types/PlayerInGame';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  cards?: Card[];
}

export function validateCardsArrangement(
  arrangement: any,
  player: PlayerInGame
): ValidationResult {
  if (!arrangement || typeof arrangement !== 'object') {
    return { isValid: false, error: 'Invalid arrangement format' };
  }

  if (arrangement.length != 12)
    return {
      isValid: false,
      error: 'Invalid input',
    };

  // Check if all cards are valid Card objects
  const parsedCards: Card[] = [];
  for (const cardStr of arrangement) {
    if (typeof cardStr !== 'string') {
      return { isValid: false, error: 'Invalid card format - expected string' };
    }

    const card = parseCardString(cardStr);
    if (!card) {
      return { isValid: false, error: `Invalid card format: ${cardStr}` };
    }
    parsedCards.push(card);
  }

  // Verify all cards belong to the player
  const playerCardSet = new Set(
    player.getPlayerPrivateState().cards?.map(card => cardToString(card))
  );
  if (!parsedCards.every(card => playerCardSet.has(cardToString(card)))) {
    return {
      isValid: false,
      error: 'Arrangement contains cards not dealt to player',
    };
  }

  // Verify no duplicate cards
  const seenCards = new Set<string>();
  for (const card of parsedCards) {
    const cardStr = cardToString(card);
    if (seenCards.has(cardStr)) {
      return { isValid: false, error: 'Duplicate cards in arrangement' };
    }
    seenCards.add(cardStr);
  }

  return {
    isValid: true,
    cards: parsedCards,
  };
}

function parseCardString(cardStr: string): Card | null {
  if (cardStr.length < 2) return null;

  const rank = cardStr.slice(0, -1);
  const suit = cardStr.slice(-1);

  if (!isValidRank(rank) || !isValidSuit(suit)) {
    return null;
  }

  return {
    rank,
    suit,
  };
}

function cardToString(card: Card): string {
  return `${card.suit}${card.rank}`;
}
