import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CatalogProvider } from "./catalogContext";
import { registerServiceWorker } from "./pwa";
import "./index.css";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <CatalogProvider>
      <App />
    </CatalogProvider>
  </BrowserRouter>
);
