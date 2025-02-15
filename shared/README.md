# Shared Module

This module defines the communication protocol between the client and server, specifying WebSocket request and response types, as well as shared objects used by both the frontend and backend, such as cards and poker positions.

## Compilation

Run:

```sh
npm install
npm run build
```

The `package.json` file defines two compilation paths:

- `/dist-node` for the backend
- `/dist-esm` for the frontend

To run the project, ensure the `shared` module is compiled and accessible to both the backend and frontend.

### Protocol Definition

The protocol is defined in **'/SocketProtocol.ts'**.
