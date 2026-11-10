# Water Traces

A quiet, dependency-free water study and participatory artwork. Open `index.html` in a browser, keeping the `js` folder beside it.

Enter through the white opening screen, explore stains, footprints, tears and rain, then make a composition in Leave a trace. Scroll, swipe vertically, or use Page Up / Page Down to move between pages. The interface is in English, with no sound, numbering, or clear button.

## Materials

`js/materials.js` renders seeded pigment deposits, grain, broken wet footprints, transparent beads and paired light/shadow ripples. The same renderer is used for scenes, Explore previews, compositions, gallery images and PNG downloads. Marks retain their original saved data format.

## Saving and collection

Drafts are stored on the current device and can be downloaded as PNG. **Public publishing is not connected:** `API_URL` in `index.html` is empty. The supplied version includes the client for publishing and reading a public collection, but this repository does not contain a deployed backend or database. Public links and cross-device retrieval require that service.

## GitHub Pages

Select GitHub Actions in Settings → Pages. The included workflow deploys `index.html`, `js/` and `studies/` on pushes to `main`, or through a manual run. Changes in this working directory are not online until pushed and deployed.

## Glass material study

Open `studies/glass/index.html` for the standalone tears-on-glass prototype. The main site’s Tears scene now embeds this same renderer. Keep its two JavaScript files in the same folder.

Click to place water; hold to add volume until it releases and runs down the glass. Drops merge, leave a thin fading film, and refract a softly blurred window/garden background. Space or Enter on the canvas adds water. Motion starts paused if the system requests reduced motion.

The view faces vertical glass with soft light from the upper left. Rendering uses a WebGL height field and an approximate optical model (water index 1.333, refraction, Fresnel reflection, window highlight). The background is procedural, not a photograph. This is a visual prototype, not a complete fluid solver. WebGL shader compilation and visual quality still need validation in a real browser; JavaScript syntax and simulation behavior have been checked.

The embedded glass renderer receives pointer input from the main canvas so existing scrolling, touch navigation and page controls remain available. It stops simulation and rendering when another page is selected.

## Rain scene

`js/rain.js` renders layered wind-driven rain, brief ballistic splashes, fading surface disturbances and muted reflections. Reduced-motion mode keeps the surface still and disables automatic rainfall. The scene includes an editorial caption and restrained entrance motion.
