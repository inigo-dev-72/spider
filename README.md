# Spider Solitaire

Juego web de Spider Solitaire hecho con HTML, CSS y JavaScript puro.

## Ejecutar en local
Abre `index.html` en un navegador moderno. Como utiliza módulos JavaScript, es recomendable usar un servidor local, por ejemplo la extensión Live Server de VS Code.

## Publicar en GitHub Pages
1. Crea un repositorio llamado `spider-solitaire`.
2. Sube el contenido de esta carpeta a la raíz del repositorio.
3. En GitHub, entra en **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige `main` y `/ (root)`, y guarda.

## Controles
- Selecciona una secuencia y luego la columna de destino; también puedes arrastrarla.
- **Deshacer** revierte el último movimiento o reparto.
- **Pista** resalta un movimiento legal y su destino. Pulsa de nuevo para ver otro.
- El mazo reparte una carta en cada columna. No se puede repartir si hay una columna vacía.

## Reglas implementadas
- Modos de 1, 2 y 4 palos.
- 104 cartas, 10 columnas y 5 repartos de diez cartas.
- Solo se pueden mover secuencias descendentes del mismo palo.
- Las secuencias completas de Rey a As se retiran automáticamente.
