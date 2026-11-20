
export function attachCardInteractions(board, handlers) {
  let dragPayload = null;
  let suppressClick = false;
  let touchSelection = null;

  // INTERACCIÓN CON RATÓN: clic
  board.addEventListener("click", event => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }

    // Los dispositivos táctiles se gestionan con pointerdown
    if (event.pointerType === "touch") return;

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

  // INTERACCIÓN TÁCTIL: tocar y tocar
  board.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;

    event.preventDefault();

    const cardEl = event.target.closest(".card.face-up");
    const columnEl = event.target.closest(".column");

    if (cardEl) {
      const from = Number(cardEl.dataset.column);
      const index = Number(cardEl.dataset.index);

      if (!touchSelection) {
        // Primer toque: seleccionar secuencia
        touchSelection = { from, index };
        handlers.select(from, index);
      } else if (touchSelection.from === from) {
        // Otro toque en la misma columna: cambiar selección
        touchSelection = { from, index };
        handlers.select(from, index);
      } else {
        // Segundo toque en otra columna: colocar secuencia
        const to = from;
        touchSelection = null;
        handlers.drop(to);
      }

    } else if (columnEl) {
      const to = Number(columnEl.dataset.column);

      if (touchSelection) {
        // Colocar en una columna vacía
        touchSelection = null;
        handlers.drop(to);
      }
    }
  });

  // ARRASTRE NATIVO PARA ORDENADOR
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

    event.dataTransfer.setDragImage(dragImage, 15, 15);

    setTimeout(() => dragImage.remove(), 0);

    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify(dragPayload)
    );

    event.dataTransfer.effectAllowed = "move";
  });

  board.addEventListener("dragend", () => {
    if (dragPayload) suppressClick = true;

    dragPayload = null;

    board.querySelectorAll(".column.drop-target")
      .forEach(el => el.classList.remove("drop-target"));
  });

  board.addEventListener("dragover", event => {
    const columnEl = event.target.closest(".column");

    if (!columnEl || !dragPayload) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    board.querySelectorAll(".column.drop-target")
      .forEach(el => el.classList.remove("drop-target"));

    columnEl.classList.add("drop-target");
  });

  board.addEventListener("dragleave", event => {
    const columnEl = event.target.closest(".column");

    if (columnEl && !columnEl.contains(event.relatedTarget)) {
      columnEl.classList.remove("drop-target");
    }
  });

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
