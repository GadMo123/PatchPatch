// Function to generate a shuffled deck of cards
export const generateDeck = (): string[] => {
  const suits = ['c', 'd', 'h', 's']; // Clubs, Diamonds, Hearts, Spades
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']; // T for Ten
  const deck: string[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}${suit}`); // Combine rank and suit
    }
  }

  return deck.sort(() => Math.random() - 0.5); // Shuffle the deck
};
