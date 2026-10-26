# Martín Giaveno — Portfolio

Responsive Spanish portfolio built with HTML, CSS, and vanilla JavaScript. No dependencies or build step.

## Preview

Run `pnpm dev` (or `node server.mjs`) from this folder, then open `http://localhost:4173`. The project has no dependencies, so no installation step is required.

## Deployment

Publish the contents of `dist/` to any static host. The PDF is included in `dist/assets/`.

## Content

The portfolio uses the supplied CV and highlights Flowy as a team project. The Flowy gallery uses five user-supplied screenshots from its demo environment, with screen selection and an enlarged dialog. Original PNGs are preserved in `dist/assets/flowy/`; CSS hides browser chrome in the gallery. Displayed amounts are demo data, not business outcome claims. Google Fonts provides the typography; system sans serif fonts remain available if it cannot load.

Edit `dist/index.html` for content, `dist/styles.css` for visual styling, and `dist/script.js` for navigation and clipboard interactions.

## Visual identity

Edit `dist/globals.css` to change the shared semantic color palette for light and dark modes. Layout styles in `dist/styles.css` consume these tokens. The theme button follows the system appearance initially and stores an explicit selection locally.
