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
