// src/index.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Main app component

// Get the root element with type assertion
const rootElement = document.getElementById("root") as HTMLElement;

// Create a root element using createRoot
const root = ReactDOM.createRoot(rootElement);

// Render the App component into the root element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
