"use strict";
// src\game\arrangeCards\PlayerArrangementValidator.ts - validates that a player's card arrangement input fits game logic (behind type handeling which happens in server handlers)
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCardsArrangement = validateCardsArrangement;
function validateCardsArrangement(arrangement, // already validated that each card is an object of two strings
player) {
    var _a;
    // Verify all cards belong to the player
    const playerCardSet = new Set((_a = player.getPlayerPrivateState().cards) === null || _a === void 0 ? void 0 : _a.map((card) => cardToString(card)));
    if (!arrangement.every((card) => playerCardSet.has(cardToString(card)))) {
        return {
            isValid: false,
            error: "Arrangement contains cards not dealt to player",
        };
    }
    // Verify no duplicate cards
    const seenCards = new Set();
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
function cardToString(card) {
    return `${card.suit}${card.rank}`;
}
//# sourceMappingURL=PlayerArrangementValidator.js.map