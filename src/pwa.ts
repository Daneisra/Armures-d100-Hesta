export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(__APP_VERSION__)}`, { scope: "/" })
      .catch(error => console.error("Service worker registration failed", error));
  });
}
