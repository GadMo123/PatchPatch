# Backend

This is the server that listens for WebSocket connections from clients and handles protocol calls.  
It maintains player statuses, player data, inventories, and game states. The server is responsible for:

- Running game flow and logic
- Managing the lobby state
- Validating and handling protocol calls from clients
- Broadcasting data to clients
- Performing CRUD operations on databases

## Directory Structure

### `/server`

Handles protocol calls by accepting incoming requests, validating their formats, and directing them to the appropriate event handlers if valid.

### `/game`

Manages all the logic for a single game instance.

#### Submodules:

- **`/arrange-card`** – Handles the card arrangement phase, including timers and client interactions for arranging cards. Validates the arrangement and ensures correctness.
- **`/betting`** – Manages a single betting round within a game. Sets up timers and listeners, validates player actions, and processes bets.
- **`/broadcasting`** – Sends the current game state to clients.
  - Since the game state is not too large and state updates occur only a few dozen times per game, the full state is broadcast to clients each time.
  - This approach simplifies state management, supports reconnections, and reduces potential single points of failure at a small resource cost.
- **`/utils`** – Contains game logic helpers for managing the gameflow, calculating positions, pot and side pots, winning hands, etc.

### `/lobby`

Handles lobby status requests. Currently, the lobby status is generated upon each client request. At a larger scale, this should be cached.

## Development Status

Some functionalities, such as /login, are still in a basic state. The primary development focus has been on game flow.
