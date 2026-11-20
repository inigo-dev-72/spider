
let audioContext = null;
let enabled = localStorage.getItem("spider-sound") !== "off";
let volume = 0.22;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

export function setSoundEnabled(value) {
  enabled = Boolean(value);
  localStorage.setItem("spider-sound", enabled ? "on" : "off");
  updateSoundButton();
}

export function toggleSound() {
  setSoundEnabled(!enabled);
  if (enabled) playSound("select");
}

export function isSoundEnabled() {
  return enabled;
}

export function updateSoundButton() {
  const button = document.getElementById("sound-toggle");

  if (!button) return;

  button.setAttribute("aria-pressed", String(enabled));
  button.title = enabled ? "Desactivar sonido" : "Activar sonido";

  const label = button.querySelector("b");

  if (label) {
    label.textContent = enabled ? "Sonido ON" : "Sonido OFF";
  } else {
    button.textContent = enabled ? "♫ Sonido ON" : "♫ Sonido OFF";
  }
}

export function playSound(type) {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const sounds = {
    select:   { notes: [520], duration: 0.07, wave: "sine" },
    move:     { notes: [390, 520], duration: 0.09, wave: "sine" },
    deal:     { notes: [300, 240], duration: 0.13, wave: "triangle" },
    flip:     { notes: [620], duration: 0.10, wave: "triangle" },
    complete: { notes: [523, 659, 784], duration: 0.16, wave: "sine" },
    undo:     { notes: [480, 360], duration: 0.10, wave: "triangle" },
    invalid:  { notes: [180], duration: 0.16, wave: "square" },
    win:      { notes: [523, 659, 784, 1047], duration: 0.22, wave: "sine" }
  };

  const sound = sounds[type];
  if (!sound) return;

  const start = ctx.currentTime;

  sound.notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteStart = start + index * sound.duration * 0.72;

    oscillator.type = sound.wave;
    oscillator.frequency.setValueAtTime(frequency, noteStart);

    gain.gain.setValueAtTime(0.001, noteStart);
    gain.gain.linearRampToValueAtTime(volume, noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      noteStart + sound.duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(noteStart);
    oscillator.stop(noteStart + sound.duration + 0.02);
  });
}

// Actualiza el control al cargar el módulo.
document.addEventListener("DOMContentLoaded", updateSoundButton);
