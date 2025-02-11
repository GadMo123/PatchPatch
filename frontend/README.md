# Frontend

This is the frontend of the application, built with React, TypeScript, and CSS. It handles the client-side view, protocol calls, and overall UI/UX.

## Key View Elements

Below are some of the key components that structure the frontend for better orientation:

- **`\screens\game\GameView`**  
  The main game screen, which includes all components related to a player's in-game experience.

- **`\gameComponents\playersCardArea\PlayerCards\PlayerCards`**  
  Displays a player's 12 private cards and allows them to rearrange them during the card arrangement phase.

- **`\gameComponents\tableAndSeats\TableAndSeats`**  
  Represents the table and seating view, allowing players to choose a seat. Poker positions rotate each hand, while absolute seating remains consistent.

- **`\gameComponents\board\PotDisplay\PotDisplay`**  
  Converts the numerical pot value into a visual chip display.

- **`\gameComponents\betting\BetPanel\BetPanel`**  
  Displays a player's betting options when it is their turn to act.

- **`\screens\lobby\MainLobby`**  
  Displays the lobby, allowing players to choose and enter a game.

## Development Status

The frontend is actively being developed. While core game functionality is in place, UI refinements, animations, and additional features are still being improved.
