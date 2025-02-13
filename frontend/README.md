# Frontend

This is the frontend of the application, built with React, TypeScript, and CSS.
Handles the client-side logic, protocol calls and UI/UX.

## Key frontend Elements

Below are some of the key components that structure the frontend for better orientation:

- **`GameView`**  
  The main game screen, which includes all components related to a player's in-game experience.

- **`PlayerCards`**  
  Displays a player's 12 private cards and allows them to rearrange them during the card arrangement phase.

- **`TableAndSeats`**  
  Represents the table and seating view, allowing players to choose a seat. Poker positions rotate each hand, while absolute seating remains consistent.

- **`BetPanel`**  
  Displays a player's betting options when it is their turn to act.

- **`MainLobby`**  
  Displays the lobby, allowing players to choose and enter a game.

- **`PotDisplay`**  
  Converts the numerical pot value into a visual chip display.

- **`CreateSocketAction`**  
  Create a generic websocket protocol call for each protocol action

## Development Status

The frontend is actively being developed. While core game functionality is in place, UI refinements, animations, and additional features are being improved constantly.
