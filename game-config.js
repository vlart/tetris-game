// Конфигурация: DOM-ссылки, темы, фигуры и начальное состояние игры.
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

// Цветовые темы и их визуальные параметры.
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
  isNextPreviewDirty = true;

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

// Матрицы семи тетромино.
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

// Изменяемое состояние текущей игровой сессии.
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
let isClearingLines = false;
let clearingRows = [];
let lineClearCounter = 0;
let scoreSaved = false;
let bestScore = 0;
let isNextPreviewDirty = true;
const maxFrameDelta = 50;

const lockDelay = 400;
const entryDelay = 250;
const lineClearDuration = 200;

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
