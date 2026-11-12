# Gullet

A pixel-art roguelike for one or two climbers. The tower is alive and hungry: climb up its throat, stomach, lungs, bowels and spine, and stop its heart before it digests you.

Play it at **https://gullet.rennko.tech**

- **6 floors**, each one an organ with its own enemies, palette, music and boss (The Dangler, The Churn, Bellows, The Coil, The Marrow King, The Heart). A full climb takes about an hour.
- **Room-by-room**: doors open when a room is clear. Wrapped caches are a free level: find them in treasure rooms and after bosses, buy them in shops (teeth) or at feeding altars (one heart).
- **Level up, keep 1 of 3**: every kill feeds XP. Each level, once the room is clear, you pick one of three random items (34 in all, everything the tower swallowed). They stack into builds: piercing, homing, bouncing, splitting, burning, chain lightning, orbiting salt and more.
- **The walls bite** if you hug them.
- **Save and quit** any time; the climb resumes in the same room.
- **Basecamp**: marrow you carry home buys permanent upgrades.
- **Online co-op** for 2 players with a 4-letter room code. The host runs the game and the guest streams it.

## Controls

| Key | Action |
| --- | --- |
| WASD | Move |
| Arrow keys / hold mouse | Throw salt |
| Space / Shift | Dash (you can't be hit while dashing) |
| 1 2 3 | Pick a level-up card |
| Esc | Pause, items, save and quit |

## Code

Plain JavaScript modules with no build step.

- `web/js/sim.js`: the whole game simulation (players, enemy AI, bosses, items, rooms, saves, co-op snapshots)
- `web/js/gen.js`: floor and room generation
- `web/js/render.js`: the 320×196 pixel renderer
- `web/js/sprites.js`: all the pixel art, hand-drawn as ASCII, plus a dithered blob painter for organs and bosses
- `web/js/audio.js`: synthesized chiptune SFX and the heartbeat music
- `web/js/net.js`, `src/worker.js`: co-op, using a Cloudflare Worker with one Durable Object per room relaying the host's snapshots and the guest's inputs
- `web/js/main.js`: menus, input, saving, the loop

```bash
./build.sh          # local dev server with co-op relay on :8830
./build.sh test     # syntax check + headless sim smoke test
./build.sh deploy   # deploy to Cloudflare
```

Made by **Virat Reddy Kaukuntla** ([@learningnihongo934-byte](https://github.com/learningnihongo934-byte))
