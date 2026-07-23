// The Vellum app runtime injects `window.vellum` into every plugin app. Its
// `fetch` is a drop-in wrapper around the browser `fetch` that reaches the
// plugin's own routes (e.g. /x/plugins/<name>/...) with the assistant's
// session/auth attached — apps use it instead of the bare global `fetch`.
declare global {
  interface Window {
    vellum: {
      fetch: typeof fetch;
    };
  }
}

export {};
