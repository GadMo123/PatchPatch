# PatchPatch

PatchPatch is inspired by a popular game played among the Israeli poker community during poker trips between tournaments, using real playing cards and chips. This digital version introduces unique twists.

## Game Overview

Each player is dealt **12 cards**, which they must split into **three flops** to create the strongest possible Omaha hands by the river. The game follows a structured betting sequence:

1. **Preflop:** Cards are dealt, followed by a betting round.
2. **Flop:** Three flops are dealt, players arrange their hands, followed by a betting round.
3. **Turn:** A turn card is dealt, followed by a betting round.
4. **River:** A river card is dealt, followed by a final betting round.
5. **Showdown:** Players reveal their hands to determine the winner of each board. Each board is worth one-third of the total pot.
6. **Next Hand:** The game continues to the next round.

## Code Design

The backend, built with TypeScript, listens for client protocol requests and handles game logic and flow. It manages asynchronous client requests to support multiplayer functionality. Currently, the backend follows a monolithic structure, but its components are modular, allowing for scalability and separation of concerns. Given the efficiency of the game protocol, a single server can handle thousands of users, so microservices and DevOps are not necessary at this stage. However, the architecture can accommodate them in the future if needed.

The frontend, built with React and TypeScript (with future plans for React Native), handles client-side logic, UI rendering, and user interactions, allowing players to make decisions and send protocol calls to the server.

A shared module defines the communication protocol between the client and server, including shared objects and interfaces. Since I am developing both the backend and frontend solo, this approach allows for quick protocol adjustments during development.

The shared module compiles twice: once in JavaScript for React compatibility and once in TypeScript for backend use. This is a temporary but convenient solution to support React while maintaining compatibility with the latest TypeScript version.

This is an ongoing project, and some core functionalities—such as time bank usage, database state management, and others—are still being integrated.

For details on each component’s internal design, refer to its respective README file.

## Future Plans

PatchPatch is designed for easy scalability, with plans to support traditional **No-Limit Hold'em** and **Pot-Limit Omaha** games in future updates.

## About This Project

This is a commercial game, and all **code and game rights** are legally protected. This repository serves as part of my **portfolio** for potential employers.

---

## How to Run the Game

### 1. Compile Shared Components

Compile the **'/shared'** module, as it is required by both the frontend and backend. See instructions in the '/shared' component README.

### 2. Install Dependencies and Build Frontend & Backend

See instructions in the '/backend' and '/frontend' component README files.

### 3. Run the Server

In the `/backend/` directory, run:

```bash
npm start
```

### 4. Open Multiple Clients

In the `/frontend/` directory, run:

```bash
npm start
```

Open additional clients by navigating to:

```bash
http://localhost:3000/
```

### 5. Start a Game

1. Choose a game and enter the game view.
2. Log in as each player.
3. Ensure enough players join the same game to meet the required minimum (visible in the lobby).
4. If you understand the 'Game Overview' section in this README, the UX should be straightforward.

### Tutorials

A full gameplay tutorial will be available upon release.
