
export function attachCardInteractions(board, handlers) {
  let dragPayload = null;
  let suppressClick = false;

  // Selección mediante clic
  board.addEventListener("click", event => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }

    const cardEl = event.target.closest(".card.face-up");
    const columnEl = event.target.closest(".column");

    if (cardEl) {
      handlers.select(
        Number(cardEl.dataset.column),
        Number(cardEl.dataset.index)
      );
    } else if (columnEl) {
      handlers.drop(Number(columnEl.dataset.column));
    }
  });

  // Inicio del arrastre
  board.addEventListener("dragstart", event => {
    const cardEl = event.target.closest(".card.face-up");

    if (!cardEl || !cardEl.draggable) {
      event.preventDefault();
      return;
    }

    dragPayload = {
      from: Number(cardEl.dataset.column),
      index: Number(cardEl.dataset.index)
    };

    // Crear una representación visual de toda la secuencia
    const column = cardEl.closest(".column");
    const cards = [...column.querySelectorAll(".card.face-up")];

    const index = Number(cardEl.dataset.index);

    const sequence = cards.filter(card =>
      Number(card.dataset.index) >= index
    );

    const dragImage = document.createElement("div");

    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    dragImage.style.left = "-1000px";
    dragImage.style.width = `${cardEl.offsetWidth}px`;
    dragImage.style.height =
      `${sequence.length * 25 + cardEl.offsetHeight}px`;

    sequence.forEach((card, i) => {
      const clone = card.cloneNode(true);

      clone.style.position = "absolute";
      clone.style.left = "0";
      clone.style.top = `${i * 25}px`;
      clone.style.width = "100%";
      clone.style.height = `${card.offsetHeight}px`;

      dragImage.appendChild(clone);
    });

    document.body.appendChild(dragImage);

    event.dataTransfer.setDragImage(
      dragImage,
      15,
      15
    );

    setTimeout(() => dragImage.remove(), 0);

    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify(dragPayload)
    );

    event.dataTransfer.effectAllowed = "move";

    // No redibujar el tablero durante el arrastre.
  });

  // Final del arrastre
  board.addEventListener("dragend", () => {
    if (dragPayload) suppressClick = true;

    dragPayload = null;

    board.querySelectorAll(".column.drop-target")
      .forEach(el => el.classList.remove("drop-target"));
  });

  // Permitir soltar sobre una columna
  board.addEventListener("dragover", event => {
    const columnEl = event.target.closest(".column");

    if (!columnEl || !dragPayload) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    board.querySelectorAll(".column.drop-target")
      .forEach(el => el.classList.remove("drop-target"));

    columnEl.classList.add("drop-target");
  });

  // Quitar resaltado al salir de una columna
  board.addEventListener("dragleave", event => {
    const columnEl = event.target.closest(".column");

    if (columnEl && !columnEl.contains(event.relatedTarget)) {
      columnEl.classList.remove("drop-target");
    }
  });

  // Soltar la carta
  board.addEventListener("drop", event => {
    const columnEl = event.target.closest(".column");

    if (!columnEl || !dragPayload) return;

    event.preventDefault();

    const { from, index } = dragPayload;
    const to = Number(columnEl.dataset.column);

    dragPayload = null;
    suppressClick = true;

    handlers.move(from, index, to);
  });
}
