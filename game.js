const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const nextCanvas = document.querySelector("#next-piece");
const nextContext = nextCanvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const levelElement = document.querySelector("#level");
const gameOverElement = document.querySelector("#game-over");
const finalScoreElement = document.querySelector("#final-score");
const scoreForm = document.querySelector("#score-form");
const playerNameInput = document.querySelector("#player-name");
const restartButtons = document.querySelectorAll(".js-restart");
const boardWrap = document.querySelector(".board-wrap");
const menuToggle = document.querySelector("#menu-toggle");
const menuPanel = document.querySelector("#menu-panel");
const menuClose = document.querySelector("#menu-close");
const resumeButton = document.querySelector("#resume-game");
const newGameButton = document.querySelector("#new-game");
const finishGameButton = document.querySelector("#finish-game");
const leaderboardToggle = document.querySelector("#leaderboard-toggle");
const leaderboardPanel = document.querySelector("#leaderboard-panel");
const leaderboardList = document.querySelector("#leaderboard-list");
const howToToggle = document.querySelector("#how-to-toggle");
const howToPanel = document.querySelector("#how-to-panel");
const themeSelect = document.querySelector("#theme-select");

const columns = 10;
const rows = 20;
const blockSize = canvas.width / columns;

const colors = {
  I: "#00c2d1",
  O: "#f9d342",
  T: "#a259ff",
  S: "#55d187",
  Z: "#ff5c57",
  J: "#4d8dff",
  L: "#ff9f1c"
};

const themeDefinitions = {
  classic: {
    board: "#17212b",
    grid: "rgba(255, 255, 255, 0.06)",
    shine: "rgba(255, 255, 255, 0.18)",
    style: "classic",
    colors: { ...colors }
  },
  "classic-random": {
    board: "#17212b",
    grid: "rgba(255, 255, 255, 0.06)",
    shine: "rgba(255, 255, 255, 0.18)",
    style: "classic",
    randomizePieces: true,
    colors: { ...colors }
  },
  console: {
    board: "#0f380f",
    grid: "rgba(155, 188, 15, 0.12)",
    shine: "rgba(224, 248, 208, 0.2)",
    style: "classic",
    colors: { I: "#9bbc0f", O: "#8bac0f", T: "#a7c51a", S: "#76920c", Z: "#93ad18", J: "#6f8610", L: "#b2ce22" }
  },
  grayscale: {
    board: "#181818",
    grid: "rgba(255, 255, 255, 0.08)",
    shine: "rgba(255, 255, 255, 0.24)",
    style: "classic",
    colors: { I: "#eeeeee", O: "#cfcfcf", T: "#ababab", S: "#8d8d8d", Z: "#737373", J: "#575757", L: "#3f3f3f" }
  },
  candy: {
    board: "#332a4d",
    grid: "rgba(255, 255, 255, 0.08)",
    shine: "rgba(255, 255, 255, 0.35)",
    style: "classic",
    colors: { I: "#77e8e1", O: "#ffe66d", T: "#c792ea", S: "#8ee3a1", Z: "#ff7b9c", J: "#82aaff", L: "#ffb86c" }
  },
  knitted: {
    board: "#332825",
    grid: "rgba(255, 239, 214, 0.06)",
    shine: "rgba(255, 246, 226, 0.22)",
    style: "knitted",
    colors: { I: "#63b7af", O: "#e7b65a", T: "#9d75b3", S: "#79a96b", Z: "#c96767", J: "#668db3", L: "#d88957" }
  },
  embossed: {
    board: "#242931",
    grid: "rgba(255, 255, 255, 0.045)",
    shine: "rgba(255, 255, 255, 0.3)",
    style: "embossed",
    colors: { I: "#63a6ad", O: "#c1a65b", T: "#8c79a8", S: "#6f9d79", Z: "#ad6d70", J: "#687fa8", L: "#af7f5e" }
  }
};
const themeKey = "tetrisTheme";
let activeTheme = themeDefinitions.classic;

function applyTheme(themeName, save = true) {
  const resolvedName = themeDefinitions[themeName] ? themeName : "classic";
  activeTheme = themeDefinitions[resolvedName];
  Object.assign(colors, activeTheme.colors);
  document.documentElement.dataset.theme = resolvedName;
  themeSelect.value = resolvedName;

  const pageColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--page-bg")
    .trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", pageColor);

  if (save) {
    try {
      localStorage.setItem(themeKey, resolvedName);
    } catch (error) {
      console.warn("Не удалось сохранить тему", error);
    }
  }
}

function initializeTheme() {
  try {
    applyTheme(localStorage.getItem(themeKey) || "classic", false);
  } catch (error) {
    applyTheme("classic", false);
  }
}

const shapes = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

const board = createBoard();
let previousGeneratedPieceName = null;
let currentPiece = createPiece();
let nextPiece = createPiece();
let previousTime = 0;
let dropCounter = 0;
let dropInterval = 700;
let lockCounter = 0;
let entryCounter = 0;
let score = 0;
let level = 1;
let isGameOver = false;
let isPaused = false;
let isWaitingForNextPiece = false;
let scoreSaved = false;

const lockDelay = 250;
const entryDelay = 200;

const lineScores = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200
};
const leaderboardKey = "tetrisLeaderboardV2";

function createBoard() {
  return Array.from({ length: rows }, () => Array(columns).fill(null));
}

function createPiece() {
  const names = Object.keys(shapes);
  let name = names[Math.floor(Math.random() * names.length)];

  if (name === previousGeneratedPieceName) {
    name = names[Math.floor(Math.random() * names.length)];
  }

  previousGeneratedPieceName = name;
  const shape = shapes[name].map((row) => [...row]);
  const randomColorName = names[Math.floor(Math.random() * names.length)];

  return {
    name,
    randomColorName,
    shape,
    x: Math.floor(columns / 2) - Math.ceil(shape[0].length / 2),
    y: 0
  };
}

function draw() {
  context.fillStyle = activeTheme.board;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawBoard();
  if (!isWaitingForNextPiece) {
    drawPiece(currentPiece);
  }
  drawNextPiece();
}

function drawGrid() {
  context.strokeStyle = activeTheme.grid;
  context.lineWidth = 1;

  for (let x = 0; x <= columns; x++) {
    context.beginPath();
    context.moveTo(x * blockSize, 0);
    context.lineTo(x * blockSize, canvas.height);
    context.stroke();
  }

  for (let y = 0; y <= rows; y++) {
    context.beginPath();
    context.moveTo(0, y * blockSize);
    context.lineTo(canvas.width, y * blockSize);
    context.stroke();
  }
}

function drawBoard() {
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawBlock(x, y, getPieceColor(cell));
      }
    });
  });
}

function drawPiece(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawBlock(piece.x + x, piece.y + y, getPieceColor(piece));
      }
    });
  });
}

function drawBlock(x, y, color) {
  const pixelX = x * blockSize;
  const pixelY = y * blockSize;

  context.fillStyle = color;
  context.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);

  if (activeTheme.style === "knitted") {
    context.strokeStyle = activeTheme.shine;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(pixelX + 5, pixelY + blockSize - 5);
    context.lineTo(pixelX + blockSize / 2, pixelY + 5);
    context.lineTo(pixelX + blockSize - 5, pixelY + blockSize - 5);
    context.stroke();
  } else if (activeTheme.style === "embossed") {
    context.fillStyle = activeTheme.shine;
    context.fillRect(pixelX + 3, pixelY + 3, blockSize - 6, 3);
    context.fillRect(pixelX + 3, pixelY + 3, 3, blockSize - 6);
    context.fillStyle = "rgba(0, 0, 0, 0.28)";
    context.fillRect(pixelX + 4, pixelY + blockSize - 6, blockSize - 7, 3);
    context.fillRect(pixelX + blockSize - 6, pixelY + 4, 3, blockSize - 7);
  } else {
    context.fillStyle = activeTheme.shine;
    context.fillRect(pixelX + 3, pixelY + 3, blockSize - 6, 5);
  }
}

function getPieceColor(piece) {
  const pieceData = typeof piece === "string" ? { name: piece } : piece;
  const colorName = activeTheme.randomizePieces
    ? pieceData.randomColorName || pieceData.name
    : pieceData.name;

  return colors[colorName];
}

function drawNextPiece() {
  const previewBlockSize = 28;
  const filledCells = [];

  nextPiece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        filledCells.push({ x, y });
      }
    });
  });

  const minX = Math.min(...filledCells.map((cell) => cell.x));
  const maxX = Math.max(...filledCells.map((cell) => cell.x));
  const minY = Math.min(...filledCells.map((cell) => cell.y));
  const maxY = Math.max(...filledCells.map((cell) => cell.y));
  const shapeWidth = (maxX - minX + 1) * previewBlockSize;
  const shapeHeight = (maxY - minY + 1) * previewBlockSize;
  const offsetX = (nextCanvas.width - shapeWidth) / 2;
  const offsetY = (nextCanvas.height - shapeHeight) / 2;

  nextContext.fillStyle = activeTheme.board;
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  filledCells.forEach((cell) => {
    const pixelX = offsetX + (cell.x - minX) * previewBlockSize;
    const pixelY = offsetY + (cell.y - minY) * previewBlockSize;

    nextContext.fillStyle = getPieceColor(nextPiece);
    nextContext.fillRect(pixelX + 1, pixelY + 1, previewBlockSize - 2, previewBlockSize - 2);
    nextContext.fillStyle = activeTheme.shine;
    nextContext.fillRect(pixelX + 3, pixelY + 3, previewBlockSize - 6, 5);
  });
}

function update(time = 0) {
  const deltaTime = time - previousTime;
  previousTime = time;

  if (!isGameOver && !isPaused) {
    if (isWaitingForNextPiece) {
      entryCounter += deltaTime;

      if (entryCounter >= entryDelay) {
        spawnNextPiece();
      }
    } else {
      dropCounter += deltaTime;

      if (dropCounter > dropInterval) {
        moveDown();
      }

      if (isGrounded()) {
        lockCounter += deltaTime;

        if (lockCounter >= lockDelay) {
          settlePiece();
        }
      } else {
        lockCounter = 0;
      }
    }
  }

  draw();
  requestAnimationFrame(update);
}

function moveDown(isSoftDrop = false) {
  if (isGameOver || isPaused || isWaitingForNextPiece) {
    return;
  }

  currentPiece.y += 1;

  if (collides(currentPiece)) {
    currentPiece.y -= 1;
  } else if (isSoftDrop) {
    score += 1;
    updateStats();
  }

  dropCounter = 0;
}

function hardDrop() {
  if (isGameOver || isPaused || isWaitingForNextPiece) {
    return;
  }

  while (!collides(currentPiece)) {
    currentPiece.y += 1;
  }

  currentPiece.y -= 1;
  lockCounter = 0;
  dropCounter = 0;
}

function settlePiece() {
  if (isWaitingForNextPiece) {
    return;
  }

  lockPiece();
  const clearedRows = clearFullRows();
  addScore(clearedRows);
  isWaitingForNextPiece = true;
  touchHardDropped = true;
  entryCounter = 0;
  lockCounter = 0;
  dropCounter = 0;
}

function spawnNextPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  isWaitingForNextPiece = false;
  entryCounter = 0;
  dropCounter = 0;

  if (collides(currentPiece)) {
    endGame();
  }
}

function moveSideways(direction) {
  if (isGameOver || isPaused || isWaitingForNextPiece) {
    return;
  }

  currentPiece.x += direction;

  if (collides(currentPiece)) {
    currentPiece.x -= direction;
  }
}

function rotatePiece() {
  if (isGameOver || isPaused || isWaitingForNextPiece) {
    return;
  }

  const originalShape = currentPiece.shape;
  currentPiece.shape = rotateMatrix(currentPiece.shape);

  if (collides(currentPiece)) {
    currentPiece.shape = originalShape;
  }
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, columnIndex) =>
    matrix.map((row) => row[columnIndex]).reverse()
  );
}

function collides(piece) {
  return piece.shape.some((row, y) =>
    row.some((cell, x) => {
      if (!cell) {
        return false;
      }

      const boardX = piece.x + x;
      const boardY = piece.y + y;

      const outsideLeft = boardX < 0;
      const outsideRight = boardX >= columns;
      const belowFloor = boardY >= rows;
      const insideBoard =
        boardX >= 0 && boardX < columns && boardY >= 0 && boardY < rows;
      const hitsLockedBlock = insideBoard && board[boardY][boardX];

      return outsideLeft || outsideRight || belowFloor || hitsLockedBlock;
    })
  );
}

function isGrounded() {
  return collides({ ...currentPiece, y: currentPiece.y + 1 });
}

function lockPiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        const boardX = currentPiece.x + x;
        const boardY = currentPiece.y + y;

        if (boardY >= 0) {
          board[boardY][boardX] = {
            name: currentPiece.name,
            randomColorName: currentPiece.randomColorName
          };
        }
      }
    });
  });
}

function clearFullRows() {
  let clearedRows = 0;

  for (let y = board.length - 1; y >= 0; y--) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(columns).fill(null));
      clearedRows += 1;
      y += 1;
    }
  }

  return clearedRows;
}

function addScore(clearedRows) {
  if (clearedRows === 0) {
    return;
  }

  score += lineScores[clearedRows] * (level + 1);
  level = Math.floor(score / 1000) + 1;
  dropInterval = Math.max(120, 700 - (level - 1) * 55);
  updateStats();
}

function updateStats() {
  scoreElement.textContent = score;
  bestScoreElement.textContent = Math.max(score, getBestScore());
  levelElement.textContent = level;
}

function resetGame() {
  board.forEach((row) => row.fill(null));
  previousGeneratedPieceName = null;
  currentPiece = createPiece();
  nextPiece = createPiece();
  previousTime = 0;
  dropCounter = 0;
  dropInterval = 700;
  lockCounter = 0;
  entryCounter = 0;
  score = 0;
  level = 1;
  isGameOver = false;
  isPaused = false;
  isWaitingForNextPiece = false;
  scoreSaved = false;
  gameOverElement.classList.add("is-hidden");
  scoreForm.classList.remove("is-hidden");
  closeMenu(false);
  updateMenuState();
  updateStats();
}

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

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(leaderboardKey)) ?? [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  localStorage.setItem(leaderboardKey, JSON.stringify(entries));
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

  saveLeaderboard(nextEntries);
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

document.addEventListener("keydown", (event) => {
  const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"];

  if (isInteractiveTarget(event.target)) {
    return;
  }

  if (gameKeys.includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "ArrowLeft") {
    moveSideways(-1);
  }

  if (event.code === "ArrowRight") {
    moveSideways(1);
  }

  if (event.code === "ArrowDown") {
    moveDown(true);
  }

  if (event.code === "Space" || event.code === "ArrowUp") {
    rotatePiece();
  }

  if (event.code === "Escape") {
    if (menuPanel.classList.contains("is-hidden")) {
      openMenu();
    } else {
      closeMenu();
    }
  }
});

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchLastX = 0;
let touchLastY = 0;
let touchMoved = false;
let touchHardDropped = false;

const gestureStep = 32;
const hardDropDistance = 120;
const tapDistance = 12;

boardWrap.addEventListener("pointerdown", (event) => {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  preventBoardDefault(event);
  touchStartX = event.clientX;
  touchStartY = event.clientY;
  touchLastX = event.clientX;
  touchLastY = event.clientY;
  touchStartTime = Date.now();
  touchMoved = false;
  touchHardDropped = false;
  boardWrap.setPointerCapture?.(event.pointerId);
});

boardWrap.addEventListener("pointermove", (event) => {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  preventBoardDefault(event);

  if (touchHardDropped) {
    return;
  }

  const totalDeltaY = event.clientY - touchStartY;
  const deltaX = event.clientX - touchLastX;
  const deltaY = event.clientY - touchLastY;
  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);

  if (
    totalDeltaY >= hardDropDistance &&
    Math.abs(totalDeltaY) > Math.abs(event.clientX - touchStartX)
  ) {
    hardDrop();
    touchLastX = event.clientX;
    touchLastY = event.clientY;
    touchMoved = true;
    touchHardDropped = true;
    return;
  }

  if (distanceX > distanceY && distanceX >= gestureStep) {
    const steps = Math.trunc(deltaX / gestureStep);
    repeatMove(Math.abs(steps), () => moveSideways(Math.sign(steps)));
    touchLastX += steps * gestureStep;
    touchMoved = true;
    return;
  }

  if (deltaY >= gestureStep) {
    const steps = Math.floor(deltaY / gestureStep);
    repeatMove(steps, () => moveDown(true));
    touchLastY += steps * gestureStep;
    touchMoved = true;
  }
});

boardWrap.addEventListener("pointerup", (event) => {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  preventBoardDefault(event);
  const deltaX = event.clientX - touchStartX;
  const deltaY = event.clientY - touchStartY;
  const elapsed = Date.now() - touchStartTime;
  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);

  if (
    !touchHardDropped &&
    !touchMoved &&
    distanceX < tapDistance &&
    distanceY < tapDistance &&
    elapsed < 350
  ) {
    rotatePiece();
  }

  boardWrap.releasePointerCapture?.(event.pointerId);
});

boardWrap.addEventListener("pointercancel", (event) => {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  preventBoardDefault(event);
  boardWrap.releasePointerCapture?.(event.pointerId);
});

boardWrap.addEventListener("touchstart", preventBoardTouch, { passive: false });
boardWrap.addEventListener("touchmove", preventBoardTouch, { passive: false });
boardWrap.addEventListener("touchend", preventBoardTouch, { passive: false });
boardWrap.addEventListener("contextmenu", preventBoardTouch);

function repeatMove(times, move) {
  for (let step = 0; step < times; step++) {
    move();
  }
}

restartButtons.forEach((button) => {
  button.addEventListener("click", resetGame);
});

gameOverElement.addEventListener("pointerdown", stopBoardGesture);
gameOverElement.addEventListener("pointermove", stopBoardGesture);
gameOverElement.addEventListener("pointerup", stopBoardGesture);
gameOverElement.addEventListener("click", stopBoardGesture);

playerNameInput.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

playerNameInput.addEventListener("click", () => {
  playerNameInput.focus();
});

menuToggle.addEventListener("click", openMenu);
menuClose.addEventListener("click", () => closeMenu());
resumeButton.addEventListener("click", () => closeMenu());
newGameButton.addEventListener("click", resetGame);
finishGameButton.addEventListener("click", () => {
  closeMenu(false);
  endGame();
});
leaderboardToggle.addEventListener("click", () => {
  renderLeaderboard();
  togglePanel(leaderboardPanel, leaderboardToggle);
});
howToToggle.addEventListener("click", () => {
  togglePanel(howToPanel, howToToggle);
});
themeSelect.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveScore(playerNameInput.value);
});

const canUseServiceWorker =
  window.location.protocol === "https:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if ("serviceWorker" in navigator && canUseServiceWorker) {
  navigator.serviceWorker.register("service-worker.js");
}

initializeTheme();
updateStats();
updateMenuState();
renderLeaderboard();
drawNextPiece();
update();
