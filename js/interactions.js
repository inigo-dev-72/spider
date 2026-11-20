
export function attachCardInteractions(board, handlers) {
  let dragPayload = null;
  let suppressClick = false;
  let touchState = null;
  let touchSelection = null;
  let dragGhost = null;

  // Evita que el clic posterior a una interacción táctil se procese dos veces.
  function preventNextClick() {
    suppressClick = true;
    setTimeout(() => {
      suppressClick = false;
    }, 500);
  }

  // Selección mediante clic de ratón.
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

  // Arrastre nativo para ratón.
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
    const sequence = cards.filter(
      card => Number(card.dataset.index) >= index
    );

    const dragImage = document.createElement("div");
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    dragImage.style.left = "-1000px";
    dragImage.style.width = `${cardEl.offsetWidth}px`;
    dragImage.style.height =
      `${(sequence.length - 1) * 25 + cardEl.offsetHeight}px`;

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

    event.dataTransfer.setData("text/plain", JSON.stringify(dragPayload));
    event.dataTransfer.effectAllowed = "move";
  });

  board.addEventListener("dragend", () => {
    if (dragPayload) preventNextClick();

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
    preventNextClick();
    handlers.move(from, index, to);
  });

  // Busca la columna que hay debajo del dedo.
  function getColumnAt(x, y) {
    const element = document.elementFromPoint(x, y);
    return element?.closest(".column") || null;
  }

  // Crea la representación visual de las cartas que se arrastran.
  function createTouchGhost(cardEl, index) {
    const column = cardEl.closest(".column");
    const cards = [...column.querySelectorAll(".card.face-up")]
      .filter(card => Number(card.dataset.index) >= index);

    const rect = cardEl.getBoundingClientRect();
    const ghost = document.createElement("div");

    ghost.style.position = "fixed";
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height =
      `${(cards.length - 1) * 25 + rect.height}px`;
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    ghost.style.opacity = "0.9";

    cards.forEach((card, i) => {
      const clone = card.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = "0";
      clone.style.top = `${i * 25}px`;
      clone.style.width = "100%";
      clone.style.height = `${card.offsetHeight}px`;
      ghost.appendChild(clone);
    });

    document.body.appendChild(ghost);
    return ghost;
  }

  function updateTouchGhost(event) {
    if (!touchState?.dragging || !dragGhost) return;

    dragGhost.style.left =
      `${event.clientX - touchState.offsetX}px`;
    dragGhost.style.top =
      `${event.clientY - touchState.offsetY}px`;

    board.querySelectorAll(".column.drop-target")
      .forEach(el => el.classList.remove("drop-target"));

    const target = getColumnAt(event.clientX, event.clientY);
    if (target) target.classList.add("drop-target");
  }

  function finishTouch(event, cancelled = false) {
    if (!touchState || event.pointerId !== touchState.pointerId) return;

    const current = touchState;
    const target = getColumnAt(event.clientX, event.clientY);
    const targetCard = document.elementFromPoint(
      event.clientX,
      event.clientY
    )?.closest(".card.face-up");

    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }

    board.querySelectorAll(".touch-drag-source")
      .forEach(card => card.classList.remove("touch-drag-source"));

    touchState = null;
    preventNextClick();

    if (cancelled) return;

    if (current.dragging) {
      if (target) {
        handlers.move(
          current.from,
          current.index,
          Number(target.dataset.column)
        );
        touchSelection = null;
      }
      return;
    }

    // Ha sido un toque, no un arrastre.
    const tappedColumn = target
      ? Number(target.dataset.column)
      : null;

    if (targetCard) {
      const from = Number(targetCard.dataset.column);
      const index = Number(targetCard.dataset.index);

      if (touchSelection && touchSelection.from !== from) {
        handlers.drop(from);
        touchSelection = null;
      } else {
        handlers.select(from, index);
        touchSelection = { from, index };
      }
    } else if (tappedColumn !== null) {
      if (touchSelection) {
        handlers.drop(tappedColumn);
        touchSelection = null;
      }
    }
  }

  // Inicio del gesto táctil.
  board.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;

    const cardEl = event.target.closest(".card.face-up");
    const columnEl = event.target.closest(".column");

    event.preventDefault();

    touchState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      from: cardEl ? Number(cardEl.dataset.column) : null,
      index: cardEl ? Number(cardEl.dataset.index) : null,
      cardEl,
      canDrag: Boolean(cardEl?.draggable),
      dragging: false,
      offsetX: 0,
      offsetY: 0
    };

    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      touchState.offsetX = event.clientX - rect.left;
      touchState.offsetY = event.clientY - rect.top;
    }

    board.setPointerCapture(event.pointerId);
  });

  // Movimiento del dedo: activa el arrastre al superar unos píxeles.
  board.addEventListener("pointermove", event => {
    if (!touchState || event.pointerId !== touchState.pointerId) return;

    const dx = event.clientX - touchState.startX;
    const dy = event.clientY - touchState.startY;
    const distance = Math.hypot(dx, dy);

    if (!touchState.dragging && touchState.canDrag && distance > 8) {
      touchState.dragging = true;

      const column = touchState.cardEl.closest(".column");
      const cards = [...column.querySelectorAll(".card.face-up")];

      cards
        .filter(card => Number(card.dataset.index) >= touchState.index)
        .forEach(card => card.classList.add("touch-drag-source"));

      dragGhost = createTouchGhost(
        touchState.cardEl,
        touchState.index
      );
    }

    updateTouchGhost(event);
  });

  board.addEventListener("pointerup", event => {
    finishTouch(event);
  });

  board.addEventListener("pointercancel", event => {
    finishTouch(event, true);
  });
}
