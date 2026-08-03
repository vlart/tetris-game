// Точка входа: Service Worker и первоначальный запуск игры.

const canUseServiceWorker =
  window.location.protocol === "https:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if ("serviceWorker" in navigator && canUseServiceWorker) {
  let isRefreshingForUpdate = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (isRefreshingForUpdate) {
      return;
    }

    isRefreshingForUpdate = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" });
}

initializeTheme();
bestScore = getBestScore();
updateStats();
updateMenuState();
renderLeaderboard();
drawNextPiece();
update();
