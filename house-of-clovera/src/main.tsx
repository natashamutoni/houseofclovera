import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import CloveraApp from "./clovera/App";
createRoot(document.getElementById("root")!).render(<StrictMode><CloveraApp /></StrictMode>);
