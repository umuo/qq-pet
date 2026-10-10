const fs = require("fs");
const path = require("path");

// Embed the existing CUR assets so every page can use them regardless of its URL.
const cursor = (name) => {
  const file = path.join(__dirname, "../../assets/img_res/hand/focus", name + ".cur");
  return `url("data:image/x-icon;base64,${fs.readFileSync(file).toString("base64")}"), pointer`;
};
const css = `
  html:root, html:root *, html:root *::before, html:root *::after {
    cursor: ${cursor("normal")} !important;
  }
  html:root[data-qqpet-hand-pressed], html:root[data-qqpet-hand-pressed] *,
  html:root[data-qqpet-hand-pressed] *::before, html:root[data-qqpet-hand-pressed] *::after {
    cursor: ${cursor("press")} !important;
  }
`;
const shadowCss = `
  :host, *, *::before, *::after { cursor: ${cursor("normal")} !important; }
  :host([data-qqpet-hand-pressed]), :host([data-qqpet-hand-pressed]) *,
  :host([data-qqpet-hand-pressed]) *::before, :host([data-qqpet-hand-pressed]) *::after {
    cursor: ${cursor("press")} !important;
  }
`;

function installHandCursor(win) {
  // User-origin rules override each window's button, text and disabled cursors.
  // Reapply after navigation/reload, when Electron removes injected styles.
  win.webContents.on("did-finish-load", () => {
    if (win.isDestroyed()) return;
    Promise.all([
      win.webContents.insertCSS(css, { cssOrigin: "user" }),
      win.webContents.executeJavaScript(`(() => {
        window.__qqPetInstallHandCursor = targetWindow => {
        if (targetWindow.__qqPetHandCursorInstalled) return;
        targetWindow.__qqPetHandCursorInstalled = true;
        const document = targetWindow.document;
        const pageStyle = document.createElement("style");
        pageStyle.textContent = ${JSON.stringify(css)};
        document.head.appendChild(pageStyle);
        const hosts = new Set();
        const mark = pressed => {
          document.documentElement.toggleAttribute("data-qqpet-hand-pressed", pressed);
          for (const host of hosts) {
            if (!host.isConnected) hosts.delete(host);
            else host.toggleAttribute("data-qqpet-hand-pressed", pressed);
          }
        };
        const scan = node => {
          if (!node.querySelectorAll) return;
          for (const el of [node, ...node.querySelectorAll("*")]) {
            if (!el.shadowRoot || hosts.has(el)) continue;
            hosts.add(el);
            el.toggleAttribute("data-qqpet-hand-pressed", document.documentElement.hasAttribute("data-qqpet-hand-pressed"));
            const style = document.createElement("style");
            style.textContent = ${JSON.stringify(shadowCss)};
            el.shadowRoot.appendChild(style);
            observe(el.shadowRoot);
            scan(el.shadowRoot);
          }
        };
        const observer = new MutationObserver(records => {
          for (const record of records) for (const node of record.addedNodes) scan(node);
        });
        const observe = root => observer.observe(root, { childList: true, subtree: true });
        observe(document); scan(document);
        const clear = () => mark(false);
        targetWindow.addEventListener("pointerdown", () => mark(true), true);
        for (const event of ["pointerup", "pointercancel", "blur"]) targetWindow.addEventListener(event, clear, true);
        };
        window.__qqPetInstallHandCursor(window);
      })()`)
    ]).catch(error => {
      if (!win.isDestroyed()) console.error("Cannot apply hand cursor", error);
    });
  });
}

module.exports = { installHandCursor };
