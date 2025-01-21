import { Game } from '../Game';
import { Card } from '../types/Card';
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

  const { cards } = arrangement;
  if (!cards || !Array.isArray(cards) || cards.length != 12)
    return {
      isValid: false,
      error: 'Invalid input',
    };

  // Check if all cards are valid Card objects
  if (!cards.every(card => isValidCard(card))) {
    return { isValid: false, error: 'Invalid card format' };
  }

  // Verify all cards belong to the player
  const playerCardSet = new Set(
    player.getPlayerPrivateState().cards?.map(card => cardToString(card))
  );
  if (!cards.every(card => playerCardSet.has(cardToString(card)))) {
    return {
      isValid: false,
      error: 'Arrangement contains cards not dealt to player',
    };
  }

  // Verify no duplicate cards
  const seenCards = new Set<string>();
  for (const card of cards) {
    const cardStr = cardToString(card);
    if (seenCards.has(cardStr)) {
      return { isValid: false, error: 'Duplicate cards in arrangement' };
    }
    seenCards.add(cardStr);
  }

  return {
    isValid: true,
    cards: cards as Card[],
  };
}

function isValidCard(card: any): card is Card {
  return (
    card &&
    typeof card === 'object' &&
    'suit' in card &&
    'rank' in card &&
    typeof card.suit === 'string' &&
    typeof card.rank === 'number'
  );
}

function cardToString(card: Card): string {
  return `${card.suit}-${card.rank}`;
}
