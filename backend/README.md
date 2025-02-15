# Backend

This is the game server that handles WebSocket connections, game flow, and protocol calls. It manages player states, inventories, and game sessions.

## Responsibilities

- Running game flow and logic
- Managing the lobby state
- Validating and handling protocol calls
- Broadcasting game state to clients
- Performing database operations

## Directory Structure

### `/server`

Handles WebSocket protocol calls, validating requests, and directing them to appropriate event handlers.

### `/game`

Manages the logic for a single game instance.

#### Submodules:

- **`arrange-card`** – Handles the card arrangement phase, including timers and validation.
- **`betting`** – Manages betting rounds, processes bets, and validates player actions.
- **`broadcasting`** – Sends the current game state to clients. The full game state is broadcasted each update to simplify state management and support reconnections.
- **`utils`** – Helper functions for calculating positions, pot distributions, winning hands, etc.

### `/lobby`

Manages lobby state requests. Currently, the lobby state is generated on demand but should be cached for scalability.

## Compile and Run

### 1. Install Dependencies and Compile

Ensure the `shared` module is compiled and available at `/shared/dist-node/`. Adjust the path in `.tsconfig` if necessary.

```bash
npm install
npm run build
```

### 2. Start the Server

```bash
npm start
```

Look for logs indicating the server is running:

```plaintext
Server running on port 5000
Created dummy games for testing
```

## Development Status

Certain features, such as login, are still in a basic state. The primary focus has been on game flow development.
