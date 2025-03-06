# Frontend

This is the frontend of the application, built with React, TypeScript, and CSS. It handles client-side logic, protocol calls, and UI/UX.

## Key Components

- **`GameView`** – The main game screen displaying all in-game elements.
- **`PlayerCards`** – Displays a player's 12 private cards and allows rearrangement during the arrangement phase.
- **`TableAndSeats`** – Represents the table and seating view. Poker positions rotate each hand, while absolute seating remains consistent.
- **`BetPanel`** – Displays a player's betting options when it’s their turn to act.
- **`MainLobby`** – Displays the game lobby, where players can select and enter a game.
- **`PotDisplay`** – Converts numerical pot values into a visual chip display.
- **`BuyInDialog`** – Allows a player sitting in a game to buy or add chips.
- **`CreateSocketAction`** – Creates generic WebSocket protocol calls for each protocol action.
- **`AnimationControl`** – Sets the default animation level based on the device and allows the user to adjust the animation level.

## Compile and Run

### 1. Install Dependencies and Compile

Ensure the `shared` module is compiled and available at `/shared/dist-esm/`. Adjust the path in `.tsconfig` if necessary.

```bash
npm install
npm run build
```

### 2. Start the Client

```bash
npm start
```

### 3. Open Multiple Clients

Open additional clients in your browser:

```bash
http://localhost:3000/
```

## Development Status

The frontend is actively being developed. While core game functionality is in place, UI refinements, animations, and additional features are continuously being improved.
