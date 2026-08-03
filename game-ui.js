// Интерфейс: меню, пауза, таблица рекордов и вспомогательные DOM-функции.
function stopBoardGesture(event) {
  if (!isInteractiveTarget(event.target)) {
    preventBoardDefault(event);
  }

  event.stopPropagation();
}

function preventBoardDefault(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function preventBoardTouch(event) {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  preventBoardDefault(event);
}

function isInteractiveTarget(target) {
  return target.closest("input, textarea, select, button, label");
}

// Состояния оверлеев: Game Over и пауза/меню.
function endGame() {
  if (isGameOver) {
    return;
  }

  isGameOver = true;
  isPaused = false;
  finalScoreElement.textContent = score;
  scoreSaved = false;
  scoreForm.classList.toggle("is-hidden", score <= 0);
  gameOverElement.classList.remove("is-hidden");
  updateMenuState();
}

function openMenu() {
  if (!isGameOver) {
    isPaused = true;
  }

  menuPanel.classList.remove("is-hidden");
  menuPanel.setAttribute("aria-hidden", "false");
  menuToggle.setAttribute("aria-expanded", "true");
  updateMenuState();
  renderLeaderboard();
}

function closeMenu(shouldResume = true) {
  menuPanel.classList.add("is-hidden");
  menuPanel.setAttribute("aria-hidden", "true");
  menuToggle.setAttribute("aria-expanded", "false");

  if (shouldResume && !isGameOver) {
    isPaused = false;
  }
}

function updateMenuState() {
  menuPanel.classList.toggle("game-is-over", isGameOver);
}

// Хранение локальной таблицы рекордов.
function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(leaderboardKey)) ?? [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  try {
    localStorage.setItem(leaderboardKey, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.warn("Не удалось сохранить результат", error);
    return false;
  }
}

function getBestScore() {
  return getLeaderboard().reduce((bestScore, entry) => Math.max(bestScore, entry.score), 0);
}

function saveScore(playerName) {
  if (scoreSaved || score <= 0) {
    return;
  }

  const cleanName = playerName.trim() || "Player";
  const nextEntries = [
    ...getLeaderboard(),
    {
      name: cleanName.slice(0, 16),
      score,
      date: new Date().toISOString()
    }
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (!saveLeaderboard(nextEntries)) {
    return;
  }

  bestScore = Math.max(bestScore, score);
  scoreSaved = true;
  scoreForm.classList.add("is-hidden");
  updateStats();
  renderLeaderboard();
}

function renderLeaderboard() {
  const entries = getLeaderboard().slice(0, 20);

  if (entries.length === 0) {
    leaderboardList.innerHTML = "<li>Пока нет результатов</li>";
    return;
  }

  leaderboardList.innerHTML = entries
    .map((entry) => `<li><strong>${escapeHtml(entry.name)}</strong> — ${entry.score}</li>`)
    .join("");
}

function togglePanel(panel, button) {
  const isHidden = panel.classList.toggle("is-hidden");
  button.setAttribute("aria-expanded", String(!isHidden));
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => {
    const symbols = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    };

    return symbols[character];
  });
}
