export class Deck {
  private deck: string[] = [];
  private suits = ['c', 'd', 'h', 's']; // Clubs, Diamonds, Hearts, Spades
  private ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']; // T for Ten

  constructor() {
    this.initializeDeck();
    this.shuffleDeck();
  }

  // Initialize the deck
  private initializeDeck() {
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        this.deck.push(`${rank}${suit}`);
      }
    }
  }

  // Shuffle the deck
  private shuffleDeck() {
    this.deck = this.deck.sort(() => Math.random() - 0.5);
  }

  // Helper function to convert card string to an object
  private convertToCardObject(card: string) {
    return {
      rank: card.slice(0, -1),
      suit: card.slice(-1),
    };
  }

  // Get player 1's cards
  getPlayer1Cards() {
    return this.deck.splice(0, 12).map(this.convertToCardObject);
  }

  // Get player 2's cards
  getPlayer2Cards() {
    return this.deck.splice(0, 12).map(this.convertToCardObject);
  }

  // Get the flops (first 3 sets of 3 cards each)
  getFlops() {
    return [
      this.deck.splice(0, 3).map(this.convertToCardObject),
      this.deck.splice(0, 3).map(this.convertToCardObject),
      this.deck.splice(0, 3).map(this.convertToCardObject),
    ];
  }

  // Get the turns (1 additional card for each flop)
  getTurns() {
    return this.deck.splice(0, 3).map(this.convertToCardObject);
  }

  // Get the rivers (final card for each flop)
  getRivers() {
    return this.deck.splice(0, 3).map(this.convertToCardObject);
  }
}
