# Overlay design rules

The overlay sits on a photographic 3D tour. The tour is the product; the overlay is instruments on top of it.
Every rule below serves one idea: **quiet chrome, loud sound.** Surfaces stay calm and dark; colour and motion are
spent on sound and on the few states a person must notice.

## Surfaces
- One surface: deep navy glass (`--surface`), 1 px hairline (`--line`), one soft shadow. No gradients on chrome.
- Radius: 8 for controls, 14 for cards, full for pins and chips. Nothing else.
- Spacing on a 4 px grid: 4, 8, 12, 16, 24. Card padding 12–14.
- A top and bottom shadow over the tour (`#ui-root::before`) so controls sit on it, not float.

## Type
- One family: Hanken Grotesk. No monospace anywhere a person reads.
- Sizes: 11 (labels, caps, 0.1em tracking), 12.5 (meta), 14 (body), 16 (titles). Weights 500 and 600.
- Numbers tabular. Sentence case. Buttons are verbs ("Apply", "Remove").
- Never show log text or ids (model ids, raw errors) as UI copy. Status appears only when loading or failing.

## Colour roles (one role per element)
| Role | Token | Used for |
|---|---|---|
| Sound | `--sound` amber | Sources, speakers, sonar, pins the agent is about to change |
| Open | `--open` teal | An open door or window, a finished step |
| Action | `--action` | The one primary button in view, the active tool |
| Danger | `--danger` | Remove |
Per-source colours in the blueprint and compass come from `PATHS_STYLE.sourceColors` (amber, teal, …).

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
- At most one floating panel at a time: the speaker card or the conversation. Opening one closes the other.
- Esc closes the topmost thing (placement, then the card). Clicking the tour never closes the card.
- Hit targets at least 32 px. Focus ring: 2 px `--action-ring`.

## Motion
- Hover 120 ms, enter 200 ms, ease-out. `prefers-reduced-motion` stops everything that loops.
- Only sound loops: the sonar, speaker rings, and the agent orb. UI chrome never animates on its own.

## Sound (blueprint and compass)
- **Sonar (`blueprint/sonar.ts`):** one emission per cycle. A wavefront (a camera-facing ring, so it reads as a
  sphere from any angle) leaves each source; a pulse rides every traced route at the same drawn speed (6 m/s); each
  wall bounce flashes when the wave reaches it. Arrivals keep their true order: direct first, then reflections by
  path length. Weaker routes are dimmer. Path lines stay as a faint trail.
- **Compass (`SoundCompass.tsx`):** a dial at the listener that turns with the view. Source dots sit at their true
  bearing, sized by how much gets through the walls; each source's echo energy (the 12 echo directions of the trace)
  is a soft shape leaning toward the walls that send sound back. It shows the room's echo time.
- Everything is computed from the same trace the audio uses. Values are estimates, and the UI says so where it
  states a number about a change.

## Agent
- It never changes the scene on its own: every change is a suggestion with Apply and Dismiss.
- It shows its steps while it works, and the pins it would change light up.
- States: idle, listening, thinking, speaking (the orb). Voice plugs into `commands.voice`.
