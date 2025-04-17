// src\game\arrangeCards\PlayerArrangementValidator.ts - validates that a player's card arrangement input fits game logic (behind type handeling which happens in server handlers)

import { Card } from "@patchpatch/shared";
import { PlayerInGame } from "../types/PlayerInGame";

interface ValidationResult {
  isValid: boolean;
  error?: string;
  cards?: Card[];
}

export function validateCardsArrangement(
  arrangement: Card[],
  player: PlayerInGame
): ValidationResult {
  const playerCards = player.getPlayerPrivateState().cards;
  if (!playerCards) {
    return { isValid: false, error: "Player has no cards" };
  }

  const playerCardSet = new Set(playerCards.map((card) => cardToString(card)));
  const seenCards = new Set<string>();

  for (const card of arrangement) {
    const cardStr = cardToString(card);

    // Check if the card exists in the player's set
    if (!playerCardSet.has(cardStr)) {
      return {
        isValid: false,
        error: "Arrangement contains cards not dealt to player",
      };
    }

    // Check for duplicates
    if (seenCards.has(cardStr)) {
      return { isValid: false, error: "Duplicate cards in arrangement" };
    }
    seenCards.add(cardStr);
  }

  return { isValid: true, cards: arrangement };
}

function cardToString(card: Card): string {
  return `${card.suit}${card.rank}`;
}
