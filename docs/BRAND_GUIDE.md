# STNG digital brand guide for WEB-STGO

Source of truth: `logo-book-colors.pdf` (17 pages, 2021). This is a practical application guide, not a replacement for the logo book.

## Canonical palette

| Brand colour | Printed RGB (page 4) | HEX | Digital role |
|---|---|---|---|
| G5002 deep blue | 24 / 46 / 120 | `#182E78` | Foundation, deep surfaces, dark text |
| G5015 blue | 11 / 124 / 181 | `#0B7CB5` | Primary action, active state, links |
| G5018 mint | 144 / 219 / 217 | `#90DBD9` | Soft illumination, focus, depth |

Silver/chrome and dark graphite are alternative supporting materials, not a fourth bright accent. UI shades in `src/theme/variables.css` are derived from this family for contrast and depth. Do not use invented yellow, amber, orange or gold as a brand accent. A warning colour is permitted only when a real status requires it and must remain a semantic status token.

## Approved logo use

- Primary horizontal colour lockup: emblem **left** of the two-line name at its supplied proportions. Use `public/assets/brand/stng-wordmark.png` on white or a very light neutral surface (pages 2–3, 5, 16).
- The book also permits a vertical lockup (page 9), abbreviation with the emblem (page 11), and the emblem alone (page 8). Use a provided official asset for each; do not construct a new lockup from a separate mark and arbitrary type.
- On corporate deep/blue, use the approved **white** lockup; on mint/light, use the approved **deep-blue** lockup. Page 5 shows these pairings. The colour lockup is approved on white and light gray, not automatically on every coloured surface.
- Monochrome black on white and white on dark are approved for appropriate one-colour applications (page 7). Silver/chrome is shown as a physical signage material on facades (pages 14–15); do not render a fake chrome DOM logo.
- Mobile may use an official emblem-only file when the full lockup would be illegible. Give the company name as adjacent HTML text or accessible text, without presenting it as a reconstructed logo. Prefer the full lockup where it fits clearly.

## Clear space and forbidden transformations

Scale uniformly and preserve the original file aspect ratio. Page 3 gives the lockup's internal spacing based on the upper flame width; keep that spacing by using the whole asset. Leave visible breathing room around it. Never mirror, rotate, stretch, redraw, recolour outside approved variants, move the emblem right, change emblem-to-type size, align the text to the emblem's outer edge, or generate the logo with AI (pages 6 and 10).

Do not place an insufficiently contrasted variant over a blue/mint gradient, medium gray, busy industrial image, or another colour that obscures its parts (page 6). Give the logo its own stable light or approved dark surface.

## Digital surfaces and 3D assets

On dark UI, start from G5002-derived blue surfaces, use white text and G5018 for controlled focus/illumination. On light UI, use pale blue-white surfaces, G5002 text and G5015 actions. Maintain a hierarchy rather than filling the page with a single official colour. Check contrast outdoors and keep functional content dominant on mobile.

Generated product visuals may depict utility equipment, documents and tablets in G5002/G5015/G5018 with restrained graphite and silver/chrome. Keep a consistent camera, material finish, shadow and lighting across the set. No generated logo, readable fake data, yellow/amber/gold highlights, fire, HUD or AI grid. A 3D asset is decorative support and must not carry an essential status or action.
