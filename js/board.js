export function canMoveRun(column, startIndex) {
  if (!column[startIndex]?.faceUp) return false;
  for (let i = startIndex; i < column.length - 1; i++) {
    const current = column[i], next = column[i + 1];
    if (!next.faceUp || current.suit !== next.suit || current.value !== next.value + 1) return false;
  }
  return true;
}

export function isValidDestination(card, destination) {
  if (!destination.length) return true;
  const top = destination[destination.length - 1];
  return top.faceUp && top.value === card.value + 1;
}

export function findCompleteRun(column) {
  if (column.length < 13) return false;
  const run = column.slice(-13);
  if (!run.every(card => card.faceUp && card.suit === run[0].suit)) return false;
  return run.every((card, index) => card.value === 13 - index);
}

export function getLegalMoves(columns) {
  const moves = [];
  columns.forEach((source, from) => {
    for (let index = 0; index < source.length; index++) {
      if (!canMoveRun(source, index)) continue;
      const card = source[index];
      columns.forEach((destination, to) => {
        if (from !== to && isValidDestination(card, destination)) {
          moves.push({ from, to, index, cardId: card.id });
        }
      });
    }
  });
  return moves;
}
