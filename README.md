# Martín Giaveno — Portfolio

Spanish personal portfolio built with semantic HTML, CSS and vanilla JavaScript. No runtime dependencies, package installation or build step.

## Run locally

```sh
node server.mjs
# or
pnpm dev
```

Open **http://localhost:4173**. Set `PORT` to override the port. The server serves the files in `dist/`, including the CV PDF and screenshot PNGs with their correct MIME types.

## Visual architecture

The editorial/engineering direction combines oversized **Space Grotesk** display type with **DM Sans** body text, paper/graphite surfaces, electric-blue accents and asymmetric sections. Google Fonts is optional: its stylesheet loads without blocking rendering, with a no-JavaScript stylesheet fallback and `display=swap`. System fonts keep content readable before the fonts arrive or if they fail.

- `dist/index.html`: Spanish content, semantic sections, metadata, project gallery and native dialog.
- `dist/globals.css`: all semantic light/dark color tokens, typography, shared easing and durations.
- `dist/styles.css`: layout, responsive geometry, focus/hover/touch feedback and motion styles.
- `dist/script.js`: theme, menu, clipboard, gallery, motion lifecycle and optional fine-pointer effects.
- `dist/assets/`: original CV, screenshots, favicon, local SVG icons and their attribution/license files.
- `server.mjs`: dependency-free local static server.

The profile and education lead into Flowy, the tool selection and contact. Flowy remains explicitly a **team project**; its full contribution and logical architecture are available in a keyboard-accessible native disclosure.

## Motion and interaction

- Accessible word-split hero, a nonblocking 1.05-second intro, lightweight orbital/aurora animation and scroll cue.
- IntersectionObserver reveals with variants/stagger; skill chips; finite counters for fifth year and the actual DOM tool selection, not business metrics.
- Sticky active-section navigation, smooth anchor scrolling, coalesced requestAnimationFrame progress and subtle decorative scroll parallax.
- Seamless technology marquee. Its pause/resume button controls **all continuous decorative animations**, not just the ribbon. Loops also pause offscreen and while the tab is hidden.
- A fine-mouse-only cursor ring retains the native cursor. Buttons use bounded magnetic translation; the project uses mild 3D tilt and a transform-positioned glare layer. Event-driven frames stop when the pointer is idle, and effects reset on leave, scroll, blur, dialog opening or capability changes.
- Theme follows the system until explicitly chosen. The choice is stored under `portfolio-theme`, storage failures are tolerated, and the early inline script avoids a theme flash. Supported browsers use a native View Transition crossfade, with a CSS fallback.
- Five decoded, race-safe gallery views, animated image swaps and native dialog opening/closing. Use visible Previous/Next controls or **Left/Right arrows**, **Tab/Shift+Tab** for focus navigation and **Escape** to close. Focus returns to the gallery opener.

`prefers-reduced-motion` is respected on initial load and when changed live: continuous/pointer/3D/parallax effects stop, smooth scrolling and heavy transitions are disabled, and content stays readable. Without JavaScript, the content, project disclosure, CV download and normal links remain available; optional interactivity and motion do not run.

## Content and assets

The existing profile, formation, technology list, contact links and CV are preserved. Flowy's five original **1917 × 1078** PNGs remain in `dist/assets/flowy/`. CSS crops browser chrome using a stable aspect ratio; image motion does not change that crop. Screenshots and displayed amounts are **demo data, not business outcomes**. All raster images specify dimensions and lazy loading.

No invented experience, proficiency percentages, business metrics or missing-content placeholders were added. The tool-selection counter derives from the visible technology buttons; update the content rather than maintaining a separate marketing number.

## Verification

Basic checks:

```sh
node --check dist/script.js
node --check server.mjs
git diff --check
```

Before release, verify both themes at **360, 768, 1280 and 1920 px**, keyboard focus/menu/dialog behavior, rapid gallery changes, denied clipboard/storage, touch input and reduced motion. Check the page with JavaScript and remote fonts unavailable as well.

### Measured local results

Verified on October 27, 2026 with Chrome 156 and Lighthouse 12.8.2, using sequential, uncontended local runs:

| Simulated profile | Performance | Accessibility | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| Mobile | 98 | 100 | 100 | 2.2 s | 0 |
| Desktop | 100 | 100 | 100 | 0.6 s | 0.001 |

Browser QA passed 20 existing-function regression checks and 21 advanced-interaction checks. Automated Axe checks, including label-in-name, reported zero violations at all four viewport widths in both themes. Font-network failure, no-JavaScript content, live reduced-motion changes and keyboard gallery controls were also checked.

These are **local simulated lab results**, not production or real-device guarantees. Repeat Lighthouse after deployment. Real-device frame-rate testing on a midrange phone remains a manual release check. External links, production metadata and the current accuracy of personal/CV information should be reviewed before deployment. No required content placeholders remain; an Open Graph preview image can be supplied as an optional follow-up.

## Deployment

Publish the contents of **`dist/`** to Vercel or any static host. No build command is required. Keep the canonical/Open Graph URL in `dist/index.html` aligned with the production domain. No deployment or push is performed by the local preview server.
