import { createRoot } from "react-dom/client";
import React from "react";
import SimpleApp from "./SimpleApp";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Setup global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Render the simplified app without complex wrappers for debugging
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SimpleApp />
  </QueryClientProvider>
);
