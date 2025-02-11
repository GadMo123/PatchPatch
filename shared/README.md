# Shared

This component defines the protocol between the client and server, specifying WebSocket request and response types, as well as shared objects used and shared by both the frontend and backend, such as cards and poker positions.

### Compilation

The `package.json` file defines two compilation paths, as explained in the main project README. Both the backend and frontend depend on this component’s output:

- `/dist-node` for the backend
- `/dist-esm` for the frontend

To run the project, you don’t need to worry about these compilation paths. Just ensure that the `shared` folder is compiled and accessible to both the backend and frontend components, and run:

```sh
npm install
```

### The protocol

Can be found in **'\SocketProtocol.ts'**
