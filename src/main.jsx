import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import { DarkModeProvider } from "./context/DarkModeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { installGlobalClickThrottle } from "./utils/actionThrottle";
import "./index.css";

installGlobalClickThrottle();

const mountNode =
  document.getElementById("dashboard") ||
  document.getElementById("root") ||
  (() => {
    const el = document.createElement("div");
    el.id = "dashboard";
    document.body.appendChild(el);
    return el;
  })();

ReactDOM.createRoot(mountNode).render(
  <HelmetProvider>
    <DarkModeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </DarkModeProvider>
  </HelmetProvider>
);
