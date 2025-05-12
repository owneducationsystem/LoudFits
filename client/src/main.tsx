import { createRoot } from "react-dom/client";
import React from "react";
import SimplifiedApp from "./SimplifiedApp";
import "./index.css";

// Setup global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Render the simplified app with Home page to test functionality
createRoot(document.getElementById("root")!).render(
  <SimplifiedApp />
);
