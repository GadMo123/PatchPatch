import { Card } from "@patchpatch/shared";

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  position: string;
  betOptions: String | null;
}
