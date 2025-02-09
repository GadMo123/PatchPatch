import { Card } from "@patchpatch/shared";

// Player's data to use and display
export interface Player {
  id: string;
  name: string;
  cards: Card[];
  position: string;
  betOptions: String | null;
}
