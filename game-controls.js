// Управление: клавиатура, touch/pointer-жесты и обработчики кнопок.
// Управление с физической клавиатуры.
const gameKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"]);

document.addEventListener("keydown", (event) => {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  if (gameKeys.has(event.code)) {
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

// Состояние одного мобильного жеста.
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchLastX = 0;
let touchLastY = 0;
let touchMoved = false;
let touchHardDropped = false;
let touchPiece = null;

const gestureStep = 32;
const hardDropDistance = 120;
const tapDistance = 12;

// Pointer Events одинаково обслуживают мышь, стилус и touch-жесты.
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
  touchPiece = currentPiece;
  boardWrap.setPointerCapture?.(event.pointerId);
});

boardWrap.addEventListener("pointermove", (event) => {
  if (isInteractiveTarget(event.target)) {
    return;
  }

  preventBoardDefault(event);

  if (touchPiece !== currentPiece) {
    return;
  }

  const totalDeltaY = event.clientY - touchStartY;
  const deltaX = event.clientX - touchLastX;
  const deltaY = event.clientY - touchLastY;
  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);

  if (
    !touchHardDropped &&
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

  if (!touchHardDropped && deltaY >= gestureStep) {
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
    touchPiece === currentPiece &&
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

// Кнопки и формы интерфейса.
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
