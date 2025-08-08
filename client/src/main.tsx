import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize the app
const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<App />);
