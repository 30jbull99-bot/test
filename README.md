# High-Fidelity Survival Sandbox

A physics-driven survival prototype rendered with modern Three.js effects. Gather luminous crystals to stay energized, push dynamic props out of the way, and kite hostile wraiths while the physically based lighting cycles from dawn to midnight.

## Features
- Physically simulated player capsule with jumping, stamina-based dashing, and crate physics powered by **cannon-es**.
- High-quality lighting that blends HDR sky atmospherics, dynamic soft shadows, bloom, and SMAA anti-aliasing.
- Collectible energy crystals that respawn over time to feed nightly upkeep costs.
- Aggressive wraiths that flank the player, delivering burst damage when they close distance.
- Large explorable clearing populated with instanced foliage and pushable props to showcase rigid-body interaction.
- Responsive HUD with mouse-lock prompts and real-time day/night progression.

## Getting started
This project does not require a build step. Serve the root directory with any static file server, then open `index.html` in your browser (Chrome or Edge recommended for WebGL2 performance).

```bash
# Using Python 3
python -m http.server 8000

# or with npm
npx serve .
```

Visit <http://localhost:8000> (or the port you chose) to play. Click the game window to lock the mouse, then use:

- **WASD** to move relative to the camera.
- **Mouse** to rotate the camera.
- **Space** to jump when grounded.
- **Shift** to expend stamina on a forward dash.

Collect crystals to stockpile food for nightly upkeep, avoid wraiths, and use crates as improvised shields.
