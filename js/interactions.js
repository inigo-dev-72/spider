export function attachCardInteractions(board, handlers) {
  board.addEventListener("click", event => {
    const cardEl = event.target.closest(".card.face-up");
    const columnEl = event.target.closest(".column");
    if (cardEl) {
      handlers.select(Number(cardEl.dataset.column), Number(cardEl.dataset.index));
    } else if (columnEl) {
      handlers.drop(Number(columnEl.dataset.column));
    }
  });

  board.addEventListener("dragstart", event => {
    const cardEl = event.target.closest(".card.face-up");
    if (!cardEl) return;
    const payload = { from: Number(cardEl.dataset.column), index: Number(cardEl.dataset.index) };
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
    handlers.select(payload.from, payload.index);
  });

  board.addEventListener("dragover", event => {
    if (event.target.closest(".column")) event.preventDefault();
  });

  board.addEventListener("drop", event => {
    const columnEl = event.target.closest(".column");
    if (!columnEl) return;
    event.preventDefault();
    handlers.drop(Number(columnEl.dataset.column));
  });
}
