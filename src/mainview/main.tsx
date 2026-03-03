import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Electrobun drag region support: observe DOM for .drag-region elements
// and add the Electrobun-specific class for window dragging
const ELECTROBUN_DRAG_CLASS = "electrobun-webkit-app-region-drag";

function syncDragRegions() {
  document.querySelectorAll(".drag-region").forEach((el) => {
    if (!el.classList.contains(ELECTROBUN_DRAG_CLASS)) {
      el.classList.add(ELECTROBUN_DRAG_CLASS);
    }
  });
}

// Prevent drag on .no-drag elements inside drag regions
// Electrobun checks target.closest() for drag class, so we stop propagation
document.addEventListener("mousedown", (e) => {
  const target = e.target as HTMLElement;
  if (target?.closest?.(".no-drag")) {
    e.stopPropagation();
  }
}, true); // capture phase to run before Electrobun's listener

// Observe DOM changes to apply drag class to dynamically added elements
const observer = new MutationObserver(syncDragRegions);
observer.observe(document.body, { childList: true, subtree: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initial sync after render
requestAnimationFrame(syncDragRegions);
