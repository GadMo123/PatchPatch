# PatchPatch

PatchPatch is inspired by a popular game played among the Israeli poker community during poker trips between tournaments, using real playing cards and chips. This version introduces unique twists.

## Game Overview

Each player is dealt **12 cards**, which they must split into **three flops** to create the strongest possible Omaha hands by the river. The game follows a structured betting round sequence:

1. **Preflop:** Cards are dealt, followed by a betting round.
2. **Flop:** Three flops are dealt, and players arrange their hands, followed by a betting round.
3. **Turn:** A turn card is dealt, followed by a betting round.
4. **River:** A river card is dealt, followed by a final betting round.
5. **Showdown:** Players reveal their hands to determine the winner of each board. Each board is worth one-third of the total pot.
6. **Next Hand:** The game continues with the next round.

## Code design

The backend component, built with TypeScript, listens for all client protocol requests and handles game logic and game flow. It manages asynchronous client requests to support multiplayer functionality for each running game. Currently, the backend is designed as a monolithic server, but its components are well-separated to allow for easy scalability and proper separation of concerns. This setup ensures that vertical scaling is possible if needed in the future. Given the nature of the game protocol, a single server can support thousands of users, so microservices and DevOps are not necessary at this stage. However, the architecture is designed to accommodate them if required.

The frontend component is built with React and TypeScript (with future plans for React Native). It manages client-side logic, UI rendering, and user interactions, allowing players to control decision trees and send protocol calls to the server.

The shared component defines the communication protocol between the client and server, including shared objects, interfaces, and the protocol itself. This design choice suits the project's current scope, as I am developing both the backend and frontend solo. It allows for quick protocol changes during development.

The shared component is configured to compile twice: once in JavaScript for React compatibility and once in TypeScript for backend use. This is a temporary but convenient solution to support React while maintaining compatibility with the latest TypeScript version.

This is an ongoing project, and some core functionalities—such as time bank usage, database state management, and others—are still not fully integrated.

For more details on each component's internal design, refer to its respective README file.

## Future Plans

PatchPatch is designed to be easily scalable, with plans to support traditional **No-Limit Hold'em** and **Pot-Limit Omaha** games in future updates.

## About This Project

This is a commercial game, and all **code and game rights** are legally protected. The purpose of this repository is to showcase my work as part of my **portfolio** for potential employers. I am open to job opportunities.

---

## How to Run the Game

### 1. Compile Shared Components

Compile the '/shared' component, as it is required by both the frontend and backend.

### 2. Install Dependencies and Build frontend and backend

Ensure you have '/shared' component in the root directory. If it is located elsewhere, update the import path in 'tsconfig.json' to point to the correct location.

run

```bash
npm install
npm run build
```

### 3. Run the server.

```bash
 npm start
```

### 4. Open multiple clients:

```bash
 npm start
```

Add additional clients:

```bash
 localhost:3000/
```

### 5. Start a game

1. Choose a game and enter the game view.
2. Log in as each player.
3. Ensure enough players join the same game to meet the required minimum (visible in the lobby).

### Tutorials

A full gameplay tutorial will be available upon release.
