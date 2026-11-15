# Overlay design rules

The overlay sits on a photographic 3D tour. The tour is the product; the overlay is instruments on top of it.
Every rule below serves one idea: **quiet chrome, loud sound.** Surfaces stay calm and dark; colour and motion are
spent on sound and on the few states a person must notice.

## Surfaces
- One surface: bone paper (`--surface`, warm off-white), a 1 px hairline (`--line`), one soft warm shadow. No gradients on chrome,
  no navy, no glow. Ink is espresso, never black.
- Radius: 8 for controls, 10 for panels, 14 for cards, full for pins and chips. Nothing else.
- Spacing on a 4 px grid: 4, 8, 12, 16, 24. Card padding 12–14.
- A warm shadow top and bottom over the tour (`#ui-root::before`) so controls sit on it, not float.

## Type
- One family: Hanken Grotesk. No monospace anywhere a person reads. No uppercase tracked labels.
- Sizes: 11 (labels), 12.5 (meta), 14 (body), 16 (titles). Weights 500 and 600. Numbers tabular. Sentence case.
- Buttons are verbs ("Apply", "Remove"). Never show log text or ids as UI copy.

## Colour roles (one role per element)
| Role | Token | Used for |
|---|---|---|
| Sound | `--sound` vermilion | The highway (outdoor source), speakers, pins the agent is about to change, loud on the heat map |
| Indoor source | ochre `#c98a1d` | The indoor music source |
| Open / action | `--open`, `--action` moss | An open door or window, the one primary button, the active tool |
| Danger | `--danger` oxblood | Remove |
Per-source colours in the blueprint and compass come from `PATHS_STYLE.sourceColors`. The heat map is one warm ramp
(bone, straw, ochre, vermilion) like a printed map.

## Layers
tour → blueprint canvas → pins → compass, dock, chat → popover (speaker card) → menus → tooltips → toasts.
Popovers, menus, tooltips and toasts are portalled to `<body>` by Radix and Sonner, so their styles are not scoped
under `#ui-root`.

## Pins (enforced in `pins.ts`)
1. Off screen or behind the camera: not drawn.
2. Behind a wall (line of sight from `occlusion.ts`): doors and windows are not drawn; speakers become a ghost
   (dashed, 55 %), because you still hear them.
3. Doors and windows further than 10 m: not drawn.
4. Two pins closer than 34 px: speakers beat openings, visible beats ghost, near beats far.
5. In dollhouse and floor plan nothing is hidden by walls (cutaway views).
6. A pin the agent proposes to change stays visible and pulses amber until the suggestion is answered.

## Panels
- Minimap, room card, compass and settings are floating panels (`Panel.tsx`): drag the title (or use the arrow keys on it),
  fold with the chevron or a double-click. Position and fold state are remembered. Unmoved panels stack under each other
  and never run past the bottom of the screen (their body scrolls).
- At most one card at the bottom: the speaker card or the conversation. Opening one closes the other.
- Esc closes the topmost thing (placement, then the card, then settings). Clicking the tour never closes the card.
- Hit targets at least 32 px. Focus ring: 2 px `--action-ring`.

## Keyboard (`keys.ts`)
- Every shortcut works after you click the tour. The tour's canvas stops key events from bubbling, so `keys.ts` listens in
  the capture phase on the page and on the tour's window, and again for every page the tour loads. A handler that uses a
  key returns `true` so the tour does not also act on it.
- B blueprint, S speaker, L probe, A (hold) compare, / agent, Esc close.

## Motion
- Hover 120 ms, enter 200 ms, ease-out. `prefers-reduced-motion` stops everything that loops.
- Only sound loops: the sonar, speaker rings, and the agent orb. UI chrome never animates on its own.

## Sound (blueprint, room card, compass)
Say what a person needs: where it comes from, how loud it is here, and what is in the way.
- **The line (`blueprint/sonar.ts`):** one dashed line per source, from the source to you. Dashes flow toward you, so the
  direction is plain. It is thick where the sound is loud and steps thinner after every wall; the wall wears a badge with
  its cost ("−21 dB"). It ends 0.75 m below the camera, because a line that ends exactly at the eye projects onto one pixel.
- **The floor:** painted by street noise (the simulation's `field`: one ray per cell). Red is where the street gets in.
- **Echoes:** off by default (Echoes in the dock). The strongest few, grouped by arrival direction, as thin dotted lines
  with a ring where each bounces.
- **Compass:** a dial at you that turns with the view: each source's direction, how much gets through, and where echoes arrive from.
- **Room card:** a listing-style fact (quiet, moderate, loud), street noise by low, mid and high, and the echo decay curve.
- Everything is computed from the same trace the audio uses. Values are estimates, and the UI says so.

## Settings (`Settings.tsx`, `materials.ts`)
- Materials per surface (walls, floor, ceiling) from the V2 library, furnishing, quality (fast, normal, high). The same three
  pickers sit on top of the plan in the blueprint ("Made of"), and the solid model recolours with them.
- A change goes to the worker (`config` message), the traced levels refresh, and every cached echo time is dropped and
  measured again as you walk in. Saved in the browser; Save and Load write a scene file; Reset restores the defaults.

## Agent
- It never changes the scene on its own: every change is a suggestion with Apply and Dismiss.
- It shows its steps while it works, and the pins it would change light up.
- States: idle, listening, thinking, speaking (the orb). Voice plugs into `commands.voice`.
