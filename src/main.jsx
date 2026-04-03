import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import "./index.css";

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
  <RouterProvider router={router} />
);
