// src\game\arrangeCards\PlayerArrangementValidator.ts - validates that a player's card arrangement input fits game logic (behind type handeling which happens in server handlers)

import { Card } from "@patchpatch/shared";
import { PlayerInGame } from "../types/PlayerInGame";

interface ValidationResult {
  isValid: boolean;
  error?: string;
  cards?: Card[];
}

export function validateCardsArrangement(
  arrangement: Card[], // already validated that each card is an object of two strings
  player: PlayerInGame
): ValidationResult {
  // Verify all cards belong to the player
  const playerCardSet = new Set(
    player.getPlayerPrivateState().cards?.map((card) => cardToString(card))
  );
  if (!arrangement.every((card) => playerCardSet.has(cardToString(card)))) {
    return {
      isValid: false,
      error: "Arrangement contains cards not dealt to player",
    };
  }

  // Verify no duplicate cards
  const seenCards = new Set<string>();
  for (const card of arrangement) {
    const cardStr = cardToString(card);
    if (seenCards.has(cardStr)) {
      return { isValid: false, error: "Duplicate cards in arrangement" };
    }
    seenCards.add(cardStr);
  }

  return {
    isValid: true,
    cards: arrangement,
  };
}

function cardToString(card: Card): string {
  return `${card.suit}${card.rank}`;
}
