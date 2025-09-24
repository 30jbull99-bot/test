# Minimal 3D Survival

A tiny survival sandbox rendered with Three.js. Gather crystals to stay energized while avoiding roaming void wraiths. Time progresses with a day/night cycle that affects lighting and enemy aggression.

## Features
- Free-roam character controller with dashing.
- Collectible crystals that restore energy and stockpile food for nightfall.
- Enemies that chase the player and drain health on contact.
- Dynamic day/night cycle that shifts the lighting, sky colour, and enemy strength.
- Responsive HUD overlay that tracks vital stats.

## Getting started
This project does not require a build step. Serve the root directory with any static file server, then open `index.html` in your browser.

```bash
# Using Python 3
python -m http.server 8000

# or with npm
npx serve .
```

Visit <http://localhost:8000> (or the port you chose) to play. Use **WASD** to move, **shift** to sprint, and **space** to dash when you have enough energy.
