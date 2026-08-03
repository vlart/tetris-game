// Игровой движок: цикл, движение, столкновения, тайминги и подсчёт очков.
// Главный цикл: падение, lock delay, анимация линий и entry delay.
function update(time = 0) {
  const deltaTime = Math.min(Math.max(time - previousTime, 0), maxFrameDelta);
  previousTime = time;

  if (!isGameOver && !isPaused) {
    if (isClearingLines) {
      lineClearCounter += deltaTime;

      if (lineClearCounter >= lineClearDuration) {
        finishLineClear();
      }
    } else if (isWaitingForNextPiece) {
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

// Закрепление фигуры и запуск очистки заполненных строк.
function settlePiece() {
  if (isWaitingForNextPiece) {
    return;
  }

  lockPiece();
  isWaitingForNextPiece = true;
  touchHardDropped = true;
  entryCounter = 0;
  lockCounter = 0;
  dropCounter = 0;

  clearingRows = findFullRows();

  if (clearingRows.length > 0) {
    isClearingLines = true;
    lineClearCounter = 0;
    triggerLineClearFeedback();
  }
}

function findFullRows() {
  return board.reduce((fullRows, row, index) => {
    if (row.every(Boolean)) {
      fullRows.push(index);
    }

    return fullRows;
  }, []);
}

function finishLineClear() {
  const clearedRows = clearFullRows();
  addScore(clearedRows);
  isClearingLines = false;
  clearingRows = [];
  lineClearCounter = 0;
  entryCounter = 0;
}

function triggerLineClearFeedback() {
  if (typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(35);
}

function spawnNextPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  isNextPreviewDirty = true;
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
    return;
  }

  lockCounter = 0;
}

function rotatePiece() {
  if (isGameOver || isPaused || isWaitingForNextPiece) {
    return;
  }

  const originalShape = currentPiece.shape;
  currentPiece.shape = rotateMatrix(currentPiece.shape);

  if (collides(currentPiece)) {
    currentPiece.shape = originalShape;
    return;
  }

  lockCounter = 0;
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, columnIndex) =>
    matrix.map((row) => row[columnIndex]).reverse()
  );
}

// Проверка столкновений со стенами, полом и закреплёнными блоками.
function collides(piece, offsetX = 0, offsetY = 0) {
  return piece.shape.some((row, y) =>
    row.some((cell, x) => {
      if (!cell) {
        return false;
      }

      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;

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
  return collides(currentPiece, 0, 1);
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
  bestScoreElement.textContent = Math.max(score, bestScore);
  levelElement.textContent = level;
}

function resetGame() {
  board.forEach((row) => row.fill(null));
  previousGeneratedPieceName = null;
  currentPiece = createPiece();
  nextPiece = createPiece();
  isNextPreviewDirty = true;
  previousTime = performance.now();
  dropCounter = 0;
  dropInterval = 700;
  lockCounter = 0;
  entryCounter = 0;
  isClearingLines = false;
  clearingRows = [];
  lineClearCounter = 0;
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
