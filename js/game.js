import { createDeck, rankLabel } from "./deck.js";
import { canMoveRun, isValidDestination, findCompleteRun, getLegalMoves } from "./board.js";
import { attachCardInteractions } from "./interactions.js";

const $ = id => document.getElementById(id);
const boardEl = $("board");
let state, history = [], selected = null, hintMove = null, seconds = 0, timerId = null, started = false;

function snapshot() {
  return JSON.stringify({ columns: state.columns, stock: state.stock, completed: state.completed, moves: state.moves, score: state.score });
}
function saveHistory() { history.push(snapshot()); $("undo").disabled = false; }
function restoreSnapshot(raw) {
  const saved = JSON.parse(raw);
  state = { ...state, ...saved };
  selected = null; hintMove = null; render();
}
function startTimer() {
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => { if (started) { seconds++; $("timer").textContent = formatTime(seconds); } }, 1000);
}
function formatTime(value) { return `${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`; }

function newGame() {
  const suits = Number($("difficulty").value);
  const deck = createDeck(suits);
  const columns = Array.from({length:10}, () => []);
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5;
    for (let row = 0; row < count; row++) {
      const card = deck.pop();
      card.faceUp = row === count - 1;
      columns[col].push(card);
    }
  }
  state = { columns, stock: deck, completed: 0, moves: 0, score: 500, suits };
  history = []; selected = null; hintMove = null; seconds = 0; started = false;
  $("timer").textContent = "00:00"; startTimer(); render();
  setStatus("Selecciona una secuencia y después una columna de destino.");
}
function restartGame() {
  if (!state) return;
  newGame();
}
function setStatus(message) { $("status").textContent = message; }

function render() {
  boardEl.innerHTML = "";
  state.columns.forEach((column, colIndex) => {
    const col = document.createElement("div");
    col.className = "column";
    col.dataset.column = colIndex;
    if (hintMove?.to === colIndex) col.classList.add("hint-target");
    if (!column.length) {
      const empty = document.createElement("div"); empty.className = "column-empty"; col.append(empty);
    }
    column.forEach((card, index) => {
      const el = document.createElement("div");
      el.className = `card ${card.faceUp ? "face-up" : "face-down"}${card.faceUp && ["♥","♦"].includes(card.suit) ? " red" : ""}`;
      el.dataset.column = colIndex; el.dataset.index = index;
      el.style.top = `${index * (window.innerWidth <= 760 ? 19 : 25)}px`;
      el.style.zIndex = index + 1;
      if (card.faceUp) {
        el.draggable = canMoveRun(column, index);
        const corner = document.createElement("div"); corner.className = "card-corner";
        corner.innerHTML = `<div class="card-rank">${rankLabel(card.value)}</div><div class="card-suit">${card.suit}</div>`;
        const center = document.createElement("div"); center.className = "card-center"; center.textContent = card.suit;
        const bottom = document.createElement("div"); bottom.className = "card-corner card-corner-bottom";
        bottom.innerHTML = `<div class="card-rank">${rankLabel(card.value)}</div><div class="card-suit">${card.suit}</div>`;
        el.append(corner, center, bottom);
        if (selected?.from === colIndex && index >= selected.index) el.classList.add("selected");
        if (hintMove?.from === colIndex && index === hintMove.index) el.classList.add("hint-card");
      }
      col.append(el);
    });
    boardEl.append(col);
  });
  $("moves").textContent = state.moves;
  $("score").textContent = state.score;
  $("completed").innerHTML = `${state.completed} <small>/ 8</small>`;
  $("stock-count").textContent = Math.ceil(state.stock.length / 10);
  $("stock").disabled = state.stock.length === 0;
  $("undo").disabled = history.length === 0;
}

function selectCard(from, index) {
  const column = state.columns[from];
  if (!column[index]?.faceUp || !canMoveRun(column, index)) {
    selected = null; render(); setStatus("Solo puedes mover secuencias descendentes del mismo palo."); return;
  }
  if (selected && selected.from === from && selected.index === index) selected = null;
  else selected = { from, index };
  hintMove = null; render();
  if (selected) setStatus("Ahora selecciona la columna donde quieres colocar la secuencia.");
}
function dropOn(to) {
  if (!selected) return;
  const { from, index } = selected;
  if (from === to) { selected = null; render(); return; }
  const source = state.columns[from], destination = state.columns[to], moving = source.slice(index);
  if (!isValidDestination(moving[0], destination)) {
    setStatus("Movimiento no válido. Coloca la carta sobre otra de valor inmediatamente superior.");
    return;
  }
  saveHistory();
  state.columns[from] = source.slice(0, index);
  state.columns[to].push(...moving);
  revealTop(from);
  state.moves++; state.score = Math.max(0, state.score - 1);
  selected = null; hintMove = null;
  removeCompleted(to);
  render(); started = true;
  setStatus("Movimiento realizado.");
  checkWin();
}
function revealTop(columnIndex) {
  const column = state.columns[columnIndex];
  if (column.length && !column[column.length - 1].faceUp) column[column.length - 1].faceUp = true;
}
function removeCompleted(columnIndex) {
  let changed = true;
  while (changed) {
    changed = false;
    const column = state.columns[columnIndex];
    if (findCompleteRun(column)) {
      column.splice(-13, 13); state.completed++; state.score += 100; changed = true;
      revealTop(columnIndex);
    }
  }
}
function dealStock() {
  if (!state.stock.length) return;
  if (state.columns.some(column => column.length === 0)) {
    setStatus("Ocupa primero todas las columnas vacías antes de repartir.");
    return;
  }
  saveHistory();
  for (let i=0; i<10; i++) {
    const card = state.stock.pop(); if (!card) break;
    card.faceUp = true; state.columns[i].push(card);
    removeCompleted(i);
  }
  state.moves++; state.score = Math.max(0, state.score - 1);
  started = true; selected = null; hintMove = null; render(); checkWin();
  setStatus("Nueva fila repartida.");
}
function undo() {
  if (!history.length) return;
  const previous = history.pop(); restoreSnapshot(previous);
  $("undo").disabled = history.length === 0;
  setStatus("Se ha deshecho el último movimiento.");
}
function showHint() {
  const moves = getLegalMoves(state.columns);
  if (!moves.length) { hintMove = null; render(); setStatus("No hay movimientos disponibles. Prueba a repartir cartas."); return; }
  let next = 0;
  if (hintMove) {
    const current = moves.findIndex(m => m.from === hintMove.from && m.to === hintMove.to && m.index === hintMove.index);
    next = (current + 1) % moves.length;
  }
  hintMove = moves[next]; selected = null; render();
  setStatus(`Pista: mueve la secuencia de la columna ${hintMove.from + 1} a la columna ${hintMove.to + 1}.`);
}
function checkWin() {
  if (state.completed === 8) {
    $("final-time").textContent = formatTime(seconds);
    $("final-score").textContent = state.score;
    $("win-dialog").showModal();
  }
}

attachCardInteractions(boardEl, { select: selectCard, drop: dropOn });
$("new-game").addEventListener("click", newGame);
$("play-again").addEventListener("click", () => { $("win-dialog").close(); newGame(); });
$("restart").addEventListener("click", restartGame);
$("undo").addEventListener("click", undo);
$("hint").addEventListener("click", showHint);
$("stock").addEventListener("click", dealStock);
$("difficulty").addEventListener("change", newGame);
window.addEventListener("resize", () => { if (state) render(); });
newGame();
