import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CommandLauncher } from "./launcher";
import "./index.css";

const isLauncherWindow =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("view") === "launcher";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isLauncherWindow ? <CommandLauncher /> : <App />}
  </React.StrictMode>
);
