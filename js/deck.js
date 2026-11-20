export const SUITS = ["♠", "♥", "♣", "♦"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck(suitCount) {
  const chosen = suitCount === 1 ? ["♠"] : suitCount === 2 ? ["♠", "♥"] : SUITS;
  const deck = [];
  for (let pack = 0; pack < 8 / chosen.length; pack++) {
    for (const suit of chosen) {
      for (let value = 1; value <= 13; value++) {
        deck.push({ suit, value, faceUp: false, id: `${pack}-${suit}-${value}-${deck.length}` });
      }
    }
  }
  return shuffle(deck);
}

export function shuffle(cards) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function rankLabel(value) {
  return ({1:"A",11:"J",12:"Q",13:"K"})[value] || String(value);
}
