import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CatalogProvider } from "./catalogContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <CatalogProvider>
      <App />
    </CatalogProvider>
  </BrowserRouter>
);
