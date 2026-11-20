# Dad’s in the Basement Again! — Web Playtest Edition (v1)

A browser adaptation of the **Version 25 Strategy Edition** of the native SwiftUI iPhone game, packaged as a **static GitHub Pages site**. No build system, developer account, npm, or backend required.

## Publish on GitHub Pages

1. Create a **new public GitHub repository**, for example `dads-in-the-basement-again`.
2. Upload **the contents of this folder** to the repository root (`index.html`, `game.js`, `data.js`, `style.css`, `assets/`, `.nojekyll`). Do not upload the containing folder as an extra directory.
3. Open **Settings → Pages** in the GitHub repository.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then **Save**.
6. Wait for the deployment. The game URL will typically be `https://YOUR-USERNAME.github.io/dads-in-the-basement-again/`.
7. Share that URL. Friends can open it in Safari, Chrome, Edge, etc. On iPhone they can use **Share → Add to Home Screen**.

GitHub Pages hosting is available for public repositories on GitHub Free. Pages is a static hosting service; it does not provide a game server.

## Features adapted from iOS v25

- Original board, box art, cream paper, card back and metallic pawn assets
- 1–5 local **pass-and-play** detectives; each friend takes a turn on the same device
- 48 board spaces, four optional detours, Family Drama deck, flip animation, and event effects
- 12 hidden mysteries with Sound, Sight, Smell and Behavior evidence
- Dice rolls, Nerve Tokens, per-character special abilities, Family Mood, and meltdown rules
- FIT and two-direction ZOOM, automatically centered on the current pawn
- Sound-only events, including the real user-supplied footsteps, sniffing, sigh, car door, dog bark, and glass clink
- Final accusation requires at least three clue types; wrong guesses cost evidence and points
- Mobile-first responsive layout, Sound On/Off control

## Important differences and limitations

- **Pass-and-play only:** This first browser version does not include remote multiplayer, online accounts, shared sessions, or saved games. Players take turns on the same phone, tablet or computer.
- The dice use an animated Unicode die rather than native SceneKit 3D.
- iOS-native haptics are not reproduced.
- Sound effects require a browser gesture before playback on some mobile browsers; the first arrival sequence may be muted if the browser blocks autoplay.
- All game logic runs locally in the browser. Refreshing the page resets the game.
- This is a first port, not a guaranteed bug-for-bug identical implementation. Test game balance, detours, and final accusation before broad distribution.

## Local preview

You can open `index.html` directly in a modern browser, or serve this folder using `python -m http.server 8000` and visit `http://localhost:8000`.

## Attribution

Original user-provided audio files have been converted to WAV in earlier iOS editions. Before publishing publicly, verify that the underlying third-party sound licenses (Freesound and other providers) permit redistribution and include any required creator attributions. This project does not assert that all audio assets are public-domain.
