// Отрисовка: игровое поле, блоки, анимация линий и preview.
// Полная перерисовка игрового поля и следующей фигуры.
function draw() {
  context.fillStyle = activeTheme.board;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawBoard();
  if (!isWaitingForNextPiece) {
    drawPiece(currentPiece);
  }

  if (isNextPreviewDirty) {
    drawNextPiece();
  }
}

function drawGrid() {
  context.strokeStyle = activeTheme.grid;
  context.lineWidth = 1;
  context.beginPath();

  for (let x = 0; x <= columns; x++) {
    context.moveTo(x * blockSize, 0);
    context.lineTo(x * blockSize, canvas.height);
  }

  for (let y = 0; y <= rows; y++) {
    context.moveTo(0, y * blockSize);
    context.lineTo(canvas.width, y * blockSize);
  }

  context.stroke();
}

function drawBoard() {
  board.forEach((row, y) => {
    const isClearingRow = isClearingLines && clearingRows.includes(y);

    if (isClearingRow) {
      const progress = Math.min(lineClearCounter / lineClearDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      context.save();
      context.globalAlpha = 1 - progress * 0.65;
      context.translate(canvas.width / 2, 0);
      context.scale(1 - easedProgress, 1);
      context.translate(-canvas.width / 2, 0);
    }

    row.forEach((cell, x) => {
      if (cell) {
        drawBlock(x, y, getPieceColor(cell));
      }
    });

    if (isClearingRow) {
      const flashOpacity = Math.max(0, 0.7 - lineClearCounter / lineClearDuration);
      context.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      context.fillRect(0, y * blockSize + 1, canvas.width, blockSize - 2);
      context.restore();
    }
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

  isNextPreviewDirty = false;
}
