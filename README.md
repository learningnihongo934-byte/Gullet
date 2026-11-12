# Gullet

A pixel-art roguelike for one or two climbers. The tower is alive and hungry: climb up its throat, stomach, lungs, bowels and spine, and stop its heart before it digests you.

Play it at **https://gullet.rennko.tech**

- **6 floors**, each one an organ with its own enemies, palette, music and boss (The Dangler, The Churn, Bellows, The Coil, The Marrow King, The Heart). A full climb takes about an hour. Pick one of 6 starting weapons first: Salt, Pepper Spray, Pebble Sling, Vinegar Flask, Bone Boomerang or Matchsticks.
- **Room-by-room**: doors open when a room is clear. Wrapped caches are a free level: find them in treasure rooms and after bosses, buy them in shops (teeth) or at feeding altars (one heart).
- **Level up, keep 1 of 3**: every kill feeds XP. Each level, once the room is clear, you pick one of three random items (150 in all, everything the tower swallowed). They stack into builds: piercing, homing, bouncing, splitting, burning, freezing, chain lightning, orbiting salt, garlic auras, wishbones that cheat death, shrapnel and more.
- **The walls bite** if you hug them.
- **Infinite mode**: past the heart lie the Liver, Kidneys, Tongue, Nerves, Eye and Brain, each with its own organ to stop. After that the tower loops, harder every time.
- **38 monster types and 12 organs**, including snipers, bombers, healers, mine-layers, wall-crawlers, teleporters, summoners and a molar that pretends to be a tooth.
- **12 weapons**: 6 to start with, plus 6 won by stopping each of the first six organs for the first time.
- **The Index** records every card, monster, organ and weapon you have found.
- **A prologue**: a short animated opening shows how the tower began.
- **Bombs (E) and 8 active items (Q)** charged by kills; bombs break lumps and crack open secret rooms.
- **6 climbers** to unlock (Wren, Brick, Pip, Old Mags, Hollow, Fang), each with their own look and quirk.
- **Story**: 18 notes from earlier climbers, Mr. Tapewell the parasite shopkeeper, and endings for the Heart and the Mind.
- **Room surprises**: secret rooms, golden mini-bosses, three-wave challenge rooms and pitch-dark rooms.
- **A tutorial** for first-time climbers, and **The Tailor**: skins, hats and trails bought with marrow.
- **Auto climb**: watch an AI play an infinite climb at up to 4× speed (a simulation; nothing is kept).
- **Sandbox**: spawn any monster or organ, paint the room, place props, switch body parts, save layouts, and give yourself any weapon, climber, active or card.
- **Desktop app** for Mac and Windows (fullscreen, works offline; co-op still goes online). Download it from [Releases](https://github.com/learningnihongo934-byte/Gullet/releases).
- **Save and quit** any time; the climb resumes in the same room.
- **Basecamp**: marrow you carry home buys permanent upgrades.
- **Online co-op** for 2 players with a 4-letter room code. The host runs the game and the guest streams it.

## Controls

| Key | Action |
| --- | --- |
| WASD | Move |
| Arrow keys / hold mouse | Throw salt |
| Space / Shift | Dash (you can't be hit while dashing) |
| E | Drop a bomb |
| Q | Use your active item |
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
./build.sh desktop  # run the desktop app
./build.sh dist     # build the Mac .dmg and Windows .zip into dist/
```

Made by **Virat Reddy Kaukuntla** ([@learningnihongo934-byte](https://github.com/learningnihongo934-byte))
