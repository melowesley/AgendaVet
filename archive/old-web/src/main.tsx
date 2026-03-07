import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;color:red;">Erro: elemento #root não encontrado</div>';
} else {
  (async () => {
    try {
      const { default: App } = await import("./App.tsx");
      createRoot(rootEl).render(React.createElement(App));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack || "" : "";
      rootEl.innerHTML = `
        <div style="padding:24px;font-family:sans-serif;max-width:600px;">
          <h1 style="color:#b91c1c;">Erro ao carregar</h1>
          <p style="color:#374151;">${msg}</p>
          <pre style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:12px;overflow:auto;">${stack}</pre>
        </div>
      `;
      console.error(err);
    }
  })();
}
