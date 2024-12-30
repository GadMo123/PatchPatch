// Function to generate a shuffled deck of cards
export const generateDeck = (): string[] => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];
  
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(`${rank} of ${suit}`);
      }
    }
  
    return deck.sort(() => Math.random() - 0.5); // Shuffle the deck
  };