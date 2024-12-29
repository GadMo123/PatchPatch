import React from 'react';
import ReactDOM from 'react-dom/client';  // Import from 'react-dom/client'
import App from './App'; // Main app component

// Create a root element using createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component into the root element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
