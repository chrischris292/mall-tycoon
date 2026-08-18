# Aurora Mall Tycoon — Project Tracker

This is the current development tracker for the native **Godot 4.7+** version of Aurora Mall Tycoon. The old web prototype and migration history are no longer tracked here; this file should stay focused on the playable game we are building now.

Future AI agents and developers should read and update this file before implementing.

### Resumable AI Development Protocol

This project is expected to evolve over many Codex sessions and quota windows. Every AI/developer session should follow this protocol before implementing:

1. Read this tracker first, especially Sections 3, 4, and 6.
2. Check `git status --short --branch` and avoid overwriting uncommitted work.
3. Pick the first incomplete task from the **Active Multi-Day Implementation Plan** unless the user gives a newer priority.
4. Implement one coherent vertical slice at a time: data model, simulation behavior, UI affordance, save/load, and visual feedback where applicable.
5. Before stopping, update this tracker with completed tasks, current branch/commit if committed, known partial work, and the recommended next task.
6. Verify in proportion to the change. For Godot work, at minimum run a headless launch with an explicit log file, for example:
   ```bash
   /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --log-file /private/tmp/aurora-alpha.log --quit-after 3
   ```
7. Keep the native Godot project as the primary game. Do not add new work to the retired web prototype unless the user explicitly asks.

---

## 1. Product Vision

Aurora Mall Tycoon should become a deep, readable, mobile-friendly mall management game where players design a mall, recruit tenants, watch shoppers use the space, fix operational bottlenecks, and grow from an incomplete property into a destination.

- **Primary target**: iOS first, then macOS/Desktop.
- **Engine**: Godot 4.7+ with GL Compatibility renderer.
- **Player fantasy**: Own the property, shape the layout, curate the tenant mix, and solve visible problems created by real shopper and staff behavior.
- **Quality bar**: A new player should understand the first session without developer explanation, and an experienced player should see enough depth to want another run.

---

## 2. Current Native Project Map

```
mall-tycoon/
├── PROJECT_TRACKER.md
├── README.md
└── godot/
    ├── project.godot
    ├── export_presets.cfg
    ├── data/
    │   ├── catalogs.json
    │   └── aurora_grand.json
    ├── scenes/
    │   └── main.tscn
    └── scripts/
        ├── main.gd
        ├── shopper.gd
        ├── sound_manager.gd
        └── tycoon_economy.gd
```

Current implementation is still concentrated in `godot/scripts/main.gd`. Future milestone work should gradually extract systems when it reduces risk: launch/save flow, UI controllers, build commands, store modules, staff jobs, and scenario progression.

---

## 3. Current Project: Player-Ready Alpha

The owner priority is no longer “add more systems.” It is to turn the current working simulation into a game a new player can understand, enjoy, fail at, recover in, and want to replay. The Living Mall Realism work remains important, but it is now sequenced behind the core player journey and one proven deep-store vertical slice.

### Owner Playtest — 2026-08-17

The native Godot build was played directly at 1× speed, resized and full-screen, with stores selected and the simulation observed across multiple in-game weeks.

#### What Is Already Worth Keeping

- The mall is visually readable from the isometric camera and already has real hallway-bound shopper traffic.
- The simulation keeps moving: shoppers arrive, stores serve guests, staff resolve incidents, leases change state, and weekly time advances.
- The data-driven tenant catalog, economy state, scenarios, entrances, save format, and procedural world generation are useful foundations.
- There are enough management systems to build a good game without restarting the engine.

#### Product Gaps Observed In The Build

1. **There is no authored beginning.** `_ready()` unconditionally loads the single save file, so the build opened at Week 46+ in a mature failing mall. There is no title screen, New Game, Continue, save-slot choice, difficulty choice, or clean first-time state.
2. **The first screen is overwhelming.** Seven equally weighted bottom tabs, six top-level stats/controls, transient toasts, a large store drawer, and the full mall appear at once. The UI presents the database before it presents the fantasy.
3. **The player has no clear first action or first win.** The scenario is selected automatically, its goals are hidden in a tab, and tutorial messages are passive event toasts. A new player is not led through leasing, opening, observing, fixing, and expanding one store.
4. **Cause and effect is too weak.** Buttons spend money immediately, but the game rarely previews the expected effect or reports the result. “+ Staff,” “Renovate,” “Premium,” and “Campaign” are choices without a readable forecast, tradeoff, or before/after explanation.
5. **The economy tells contradictory stories.** During the playtest cash climbed above $60k while reputation stayed near 10%, cleanliness near 13–15%, and most selected tenants were at-risk with near-zero satisfaction. The player cannot tell whether they are winning, surviving, or exploiting a tuning bug.
6. **Problems are notifications, not gameplay.** Repeated generic shopper complaints (“They were out of what I wanted”) do not identify the shopper, store, cause, consequence, or suggested response. A spill visibly resolved itself through staff and produced a toast; the player did not need to notice or decide anything.
7. **Stores are still buttons attached to boxes.** Store interiors differ cosmetically, but management is the same generic pricing/staff/restock/facade panel. There is no spatial store editing, equipment placement, queue tuning, or store-specific operating loop.
8. **Mall creation is not yet the core fantasy.** “Architect & Amenities” places concourse objects but does not let the player draw hallways, add entrances, zone lots, buy land, demolish safely, or grow a starter mall into a personal design.
9. **Progression exists as data, not a journey.** Three scenarios and prestige values exist, but only the first scenario is initialized. Completing it does not visibly advance a campaign, unlock tenants/tools, or offer a new challenge.
10. **There is no meaningful ending or recovery arc.** No bankruptcy pressure, loans, rescue tools, tenant departure drama, scenario fail state, victory presentation, or post-scenario continuation gives the session shape.
11. **The presentation does not yet sell character or place.** Shoppers and staff remain generic capsules, stores lack strong silhouettes, and the dark void around the mall makes it feel like a model viewer rather than a destination.
12. **The UI is not robust at product resolutions.** It uses fixed 1280×720 positions and oversized always-visible panels; full-screen testing exposed large unused space and an inspector that dominates the world view. This must be solved before iOS polish.

### Alpha Product Promise

“Start with a struggling piece of property, design the mall people want, recruit tenants, watch real shoppers use it, fix the bottlenecks you can see, and grow it into a destination.”

Every feature must strengthen at least one verb in that promise: **design, recruit, watch, fix, or grow**.

### Player-Ready Alpha Exit Criteria

- A new player can start a fresh game, open their first stores, understand a problem, fix it, and complete a first objective without developer explanation.
- A 30-minute session contains at least three meaningful decisions with visible tradeoffs and at least one memorable event.
- A 60-minute scenario has a beginning, escalation, win/fail state, reward, and reason to try another mall or strategy.
- Small, medium, and large starter malls feel like different challenges, not only different footprints.
- The game saves safely, restores exactly, fits target iPhone/iPad safe areas, and maintains the agreed mobile performance budget.

---

## 4. Active Multi-Day Implementation Plan

This is the only active plan. Work from the first incomplete phase unless the user sets a newer priority. Each phase must preserve existing features, update save migrations, add proportional automated checks, and finish with a Godot preview plus a short owner playtest note.

### Phase A: New Game, First Ten Minutes & UI Triage

- **2026-08-17 progress**: Added the Phase A launch shell with New Game, Continue, scenario selection, settings toggles, and save-slot selection; stopped unconditional save auto-load; added slot saves with backup files and weekly autosave; added a clean Starter Wing new-game state with curated open stores plus visible vacant units; fixed Continue visual rebuilding after save load; added an event-driven first objective chain with an owner card and a world-space guidance marker; made the top/drawer/bottom HUD reflow from the current viewport with shorter mode labels; added slot status labels plus restore-backup/clear-slot controls with confirmation prompts; added hide/replay controls for owner guidance; added a first-week milestone overlay; split the launcher into Overview/Scenarios/Settings/Saves subviews; and added a first compact safe-margin pass for iOS-shaped screens. Phase A still needs human playtest proof against the owner gate.
- [x] Add a launch flow with **New Game**, **Continue**, **Scenarios**, and **Settings**. Never auto-load a save without player intent.
- [x] Add versioned save slots, an explicit fresh-start path, autosave, and a recoverable backup save.
- [x] Start New Game paused in a healthy small mall with a controlled budget, a few open stores, clear vacant lots, and no immediate failure cascade.
- [x] Build a guided first objective chain: inspect entrance traffic → lease a tenant → open/store observe → fix one stock or staffing issue → collect first weekly result.
- [x] Replace tutorial toasts with contextual callouts anchored to the relevant world object or control; allow skip/replay.
- [ ] Triage the HUD into three layers: always-visible essentials, contextual selected-object actions, and optional management modes. Collapse or hide the drawer when nothing is selected.
- [x] Add a clear current objective card and one recommended next action without removing sandbox freedom.
- [ ] Make UI layout responsive to safe areas, window aspect ratio, and iPhone/iPad touch sizes instead of relying on fixed 1280×720 coordinates.
- **Owner gate**: Five first-time testers can reach the first positive weekly result in under 10 minutes without verbal help, and at least four can explain why their result changed.

### Phase B: Mall Creation & Expansion As The Core Fantasy

#### Project B2 — Mall Layout Builder 2.0 (Mobile-Only)

**Status: specification approved for implementation; no B2 implementation has started.** The current 6×6 tap-to-place hallway feature and Aurora Starter Promenade are prototypes, not the foundation to extend. They may remain playable until B2 reaches migration, but agents must not add more special cases to them.

**Why this project exists:** the prototype stores arbitrary corridor rectangles, infers storefront direction from world position, accepts “near enough” connections, and asks the player to place isolated tiles. This produces visible seams, false connections, stores facing or routing incorrectly, and a touch flow that feels like a debug tool. B2 replaces those assumptions while preserving the economy, tenants, shoppers, staff, scenarios, store operations, and saves through an explicit migration layer.

##### B2 Product Contract

- The game targets **iPhone and iPad in landscape**. Desktop input may remain useful for development, but no B2 interaction or UI decision should be justified by mouse/keyboard convenience.
- A player draws meaningful hallway **runs**, courts, and lots with one-finger gestures; they should not need to tap every floor tile.
- The engine uses a precise structural grid for correctness and magnetic snapping, while 45-degree segments, gentle curves, variable widths, and freeform courts provide organic layouts.
- Topology is authoritative; meshes are presentation. Two pieces connect only when their declared connector geometry connects, never because their meshes look close.
- Every store lot has an explicit frontage edge and public door connector. Store orientation must never be inferred from whether its center is north or south of the map origin.
- Shopper/staff navigation is generated only from validated public corridor surfaces, doors, entrances, and permitted store interiors. Vacant or occupied lots are never generic walkable space.
- Every edit is a command with preview, validation, cost forecast, confirm/cancel, undo/redo, save serialization, and an event result.
- The starter mall is authored with the same public tools and schema available to players. No hidden layout-only exceptions are allowed.

##### Locked Geometry Decisions

1. **Structural lattice:** integer `Vector2i` coordinates with one cell equal to 2 meters. Never use floating-point world positions as identity keys.
2. **Hallways:** stored as centerline segments with integer endpoints plus `width_cells`. Standard mall hallway width is 3 cells (6 m); narrow service/public connectors may use 2 cells; courts are separate surfaces.
3. **Geometry tiers:** ship orthogonal segments first, then 45-degree segments, then cubic/gentle curve segments. All tiers share the same command, validation, graph, save, and render interfaces.
4. **Connectivity:** segment endpoints snap to named connector ports or graph nodes. Crossings create a junction only after the validator/rasterizer proves their public surfaces overlap legally.
5. **Lots:** start as grid-aligned rectangles, then support editable convex polygons. A lot owns footprint, frontage edge, door connector, category constraints, and back-of-house edge.
6. **Entrances/exits:** explicit placed objects with an exterior spawn connector and interior corridor connector. Agents spawn outside the property, walk through the entrance connector, and leave through an exterior connector.
7. **Canonical occupancy:** rasterization produces deterministic occupied-cell sets for corridors, lots, blockers, construction zones, and parcels. This is used for overlap checks and coarse queries; the graph/nav surface handles movement.
8. **Visual seams:** renderers slightly overlap coplanar floor pieces internally and rebuild junction caps. This is presentation only and must not be used to fake connectivity.
9. **Coordinates:** blueprint data remains in lattice coordinates. Convert to Godot meters only at renderer/navigation boundaries through one shared converter.
10. **IDs:** every segment, court, lot, door, entrance, junction, parcel, and command gets a stable string ID. Array index is never object identity.

##### Required Code Boundaries

New B2 code belongs under `godot/scripts/layout/` and `godot/scenes/ui/build/`. Do not continue growing layout rules inside `main.gd`.

```text
godot/scripts/layout/
├── layout_state.gd              # Pure authoritative data; no meshes or UI nodes
├── layout_schema.gd             # Version constants, parsing, migration, validation errors
├── layout_coordinates.gd        # Cell/world conversion and snap policies
├── layout_rasterizer.gd         # Segments/courts/lots -> deterministic occupied cells/polygons
├── layout_graph.gd              # Junction, connector, frontage, entrance, and reachability graph
├── layout_validator.gd          # Pure preflight and whole-layout invariant checks
├── layout_command.gd            # Base command/result interfaces
├── commands/                    # Draw/edit/delete corridor, court, lot, door, entrance, parcel
├── layout_history.gd            # Confirmed commands, undo/redo, transaction summaries
├── layout_renderer.gd           # Incremental floor/junction/wall/storefront visuals
├── layout_navigation.gd         # Public nav surfaces and door/entrance links
├── layout_save_codec.gd         # Blueprint serialization separate from business state
└── layout_test_factory.gd       # Small deterministic fixtures shared by tests

godot/scripts/build/
├── build_touch_controller.gd    # Mobile gesture state machine; emits intents only
├── build_preview_controller.gd  # Ghosts, handles, validity, live cost, snap feedback
└── build_mode_coordinator.gd    # Connects touch intents, commands, history, UI, camera lock

godot/scenes/ui/build/
├── build_bottom_sheet.tscn
├── build_tool_rail.tscn
├── build_context_bar.tscn
└── build_selection_inspector.tscn
```

Rules for agents:

- Domain classes may not call `get_node`, create meshes, read touch events, or mutate cash directly.
- The touch controller may not mutate layout state. It emits start/update/end/cancel intents.
- Commands are the only path from a player edit to layout mutation.
- The renderer and navigation builder consume a successful command result/change set; they never determine whether an edit is legal.
- Economy charges/refunds consume the command result after validation and before commit. A failed charge leaves layout unchanged.
- Each new layout object type requires schema, command, validator, renderer, save/load, undo/redo, and at least one automated fixture in the same milestone.

##### Blueprint Schema v3 Contract

The exact JSON field spelling may be refined only in B2-01 and then must be frozen. The structure must preserve these concepts:

```json
{
  "layout_schema_version": 3,
  "blueprint_id": "cedar_grove_starter",
  "grid_meters": 2.0,
  "parcels": [{"id": "parcel_core", "polygon": [[-20,-12],[20,-12],[20,12],[-20,12]], "unlocked": true}],
  "corridors": [{"id": "promenade_a", "geometry": "orthogonal", "points": [[-14,2],[4,2],[4,-8]], "width_cells": 3}],
  "courts": [{"id": "garden_court", "polygon": [[-2,-1],[5,-1],[5,6],[-2,6]]}],
  "entrances": [{"id": "entry_west", "exterior": [-18,2], "interior_connector": "promenade_a:start"}],
  "lots": [{"id": "lot_01", "footprint": [[-12,-5],[-7,-5],[-7,-1],[-12,-1]], "frontage": {"edge": 2, "door_offset_cells": 2}}],
  "expansion_ports": [{"id": "port_east", "connector": "promenade_a:end", "parcel_id": "parcel_east"}]
}
```

The codec must reject duplicate IDs, non-integer lattice coordinates, self-intersecting polygons, missing connectors, unversioned data, and unknown required enum values with actionable errors. Business saves reference `blueprint_id` plus an embedded/owned layout snapshot; they must not depend on whatever starter JSON ships in a later app version.

##### Mobile Interaction Specification

**Build-mode navigation**

- Entering Build pauses the simulation by default and opens a compact bottom sheet above the safe area.
- One finger manipulates the selected build tool. Two fingers always pan/zoom/rotate the camera, even while a tool is active.
- A touch becomes a draw gesture only after a 12-point movement threshold; below that threshold it is a tap/select. This prevents accidental tiny segments.
- Starting a two-finger camera gesture cancels an unconfirmed one-finger preview and never commits construction.
- World targets remain visible above the finger through an offset cursor/handle. Never require the user to see directly under their thumb.

**Hallway draw flow**

1. Tap **Hallway** in the bottom tool rail.
2. Touch a valid connector, corridor edge, or empty lattice point. The nearest legal start magnetizes and gives a snap pulse.
3. Drag to set the end. The engine previews straight, L-shaped, or 45-degree candidates and chooses the least-cost valid candidate; the player can tap a route-style chip to cycle candidates.
4. Width chips show Narrow (4 m), Standard (6 m), and Grand (8 m). Standard is default.
5. Releasing the finger keeps the preview selected with large endpoint handles. Dragging a handle edits it; tapping a segment inserts a bend where legal.
6. The context bar shows length, area, construction cost, estimated build time, affected doors, and a plain-language validation message.
7. **Build** confirms; **Cancel** discards; **Undo/Redo** remain available after commit. The hallway tool stays active for consecutive construction until the player taps Done/Back.

**Flexible layout flow**

- Orthogonal is the default because it is fast and readable on a phone.
- A 45° toggle appears only after B2-11. Curves use a single large bend handle after the start/end gesture; players do not manipulate Bézier tangents directly on a phone.
- Holding near an existing endpoint opens a magnetic branch preview; it does not rely on a hidden long-press to access essential behavior.
- Courts use drag-to-size followed by corner handles. Organic courts are created by adding/removing a small number of boundary handles, with self-intersection prevention.

**Lot/store flow**

- Tap **Lot**, drag along a corridor frontage, then drag outward to set depth. This guarantees a meaningful frontage before a footprint exists.
- The preview shows the public-facing edge, centered door, service/back edge, leasable area, and category compatibility.
- Door handles slide only along validated frontage. Rotating a lot rotates its frontage and recomputes the door; it never derives facing from map position.
- Stores render flush to the lot boundary with the shopfront on frontage, walls on side/back edges, and no geometry in the public hallway.

**Feedback and accessibility**

- Valid preview: cyan/green plus a check icon. Invalid preview: striped red plus a short reason. Warning: amber plus consequence. Never communicate validity by color alone.
- Buttons and drag handles are at least 44×44 points; primary Build/Cancel actions are at least 52 points high.
- Respect iOS safe areas, Dynamic Type/text scale, left/right-handed bottom-sheet placement, reduced motion, and color-safe palettes.
- Haptic events go through one abstraction: soft snap, medium successful build, warning invalid, heavy destructive confirm. The game must remain understandable with haptics/audio disabled.

##### Whole-Layout Invariants

Every confirmed command and every loaded blueprint must pass these checks:

1. All permanent public entrances connect exterior space to exactly one reachable public corridor component.
2. At least one entrance remains usable after demolition; scenario-required entrances cannot be removed.
3. Every open or leasable store has exactly one primary public door on a declared frontage touching public corridor/court surface.
4. Doors do not open through another lot, wall, locked parcel, construction blocker, or non-public/service corridor.
5. Corridor surfaces connect only through shared graph nodes or legal overlap/junction geometry; visual proximity is irrelevant.
6. Public corridors, courts, entrances, and door links do not overlap lot interiors or locked/out-of-bounds parcels.
7. Shoppers can reach every open store from at least one entrance and can reach at least one exit from that store.
8. Staff-only/service regions never become shopper shortcuts unless an object explicitly grants public access.
9. Demolition cannot orphan an open store, trap active agents, split all entrances from all exits, or remove the only path to a required objective.
10. Corridor width and curve radius meet the configured minimum; rasterization yields no zero-width slivers or one-cell diagonal pinches.
11. Stable IDs are unique and references resolve. Undo/redo restores identical state hashes.
12. Save → load → save produces semantically identical layout state independent of JSON key order.

##### Cedar Grove Starter Mall Contract

B2 replaces Aurora Starter Promenade only after the new engine, validator, and mobile builder can author and load the replacement. Working name: **Cedar Grove Galleria**.

- Shape: an asymmetric dog-leg promenade connecting a small garden court to an offset lantern court; explicitly not a cross.
- Scale: small starter property, two connected public entrances at opposite ends, 8–10 initial lots, 4 open tenants, remaining lots vacant.
- Stores: every lot is outside the corridor surface, flush to one frontage, with back walls facing the property exterior/service side. No store may be positioned by a “north half/south half” shortcut.
- Cinema: excluded from the small starter. It becomes a medium/large expansion anchor after the category module can represent a proper lobby, concessions, auditorium depth, and crowd release.
- Growth: at least three visible expansion ports leading to differently shaped parcels. Each port must accept the first hallway gesture without a special-case tolerance.
- Teaching: one empty frontage near the initial objective supports the first player-created lot; one short missing connection demonstrates hallway drawing; neither blocks normal operation.
- Presentation: two distinct courts, seating/planting, coherent storefront rhythm, clear exterior edges, service-facing backs, and enough negative space that the player can read growth opportunities at phone zoom.
- Economy: healthy but incomplete. Starting cash covers one standard hallway run, two standard lots, one tenant lease, and a 20% recovery reserve.
- Proof: authored entirely through schema/commands used by players, passes all invariants, and is included as an automated load fixture.

##### B2 Milestone Queue

Agents must take the first incomplete milestone whose dependencies are complete. Do not work ahead on starter visuals before topology, frontage, and mobile gestures are proven.

###### B2-00 — Freeze Specification and Baseline `[complete 2026-08-17]`

- Deliverable: this project contract, prototype limitation record, locked mobile scope, milestone IDs, and owner gate.
- Evidence: no experimental B2 code was retained during planning; the existing playable prototype remains unchanged.
- Next: B2-01.

###### B2-01 — Characterization Tests and Schema Fixture `[complete 2026-08-17]`

- **Depends on:** B2-00.
- **Scope:** document current hallway/store/save behavior without changing it; add minimal headless test entry points and v3 fixture files.
- **Files:** `godot/tests/layout/`, `godot/data/layout_fixtures/`, `layout_schema.gd` skeleton only.
- **Deliverables:** fixtures for connected run, disconnected run, corner, T-junction, two entrances, valid lot frontage, orphaned door, overlap, and save round-trip; current v2 prototype fixture captured for migration.
- **Acceptance:** fixtures load deterministically; invalid fixtures state the expected error code; headless test command exits nonzero on failure.
- **Do not:** change rendering, input, `aurora_grand.json`, shoppers, or `main.gd` behavior.
- **Completed evidence:** added the B2 layout fixture directory, a pure `layout_schema.gd` v3 validation skeleton, and `godot/tests/layout/test_layout_schema.gd`. Fixture coverage now includes Cedar Grove minimal connected run, disconnected run, T-junction, two entrances, valid lot frontage, orphan/missing connector, overlapping lots, non-integer coordinates, unknown enum, self-intersecting polygon, and a captured legacy Aurora v2 snapshot for the future migration milestone.
- **Verification:** `/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_schema.gd` passed.
- **Next:** B2-02.

###### B2-02 — Extract Authoritative Layout State `[complete 2026-08-17]`

- **Depends on:** B2-01.
- **Scope:** create pure `LayoutState`, stable ID registries, coordinate conversion, immutable-ish snapshots/state hashing, and typed object dictionaries/resources.
- **Deliverables:** state can add/query/remove corridors, courts, lots, doors, entrances, parcels, and expansion ports without scene nodes; old game can still run using its current path.
- **Acceptance:** duplicate IDs fail; cell/world round trips are exact; two equivalent states produce the same hash; unit tests cover every object type.
- **Do not:** add the new UI or render new meshes.
- **Completed evidence:** added pure `LayoutState`, `LayoutCoordinates`, and `LayoutTestFactory` scripts under `godot/scripts/layout/`. The state supports add/query/remove for corridors, courts, lots, entrances, and expansion ports, enforces stable IDs across collections, provides exact cell/world conversion, and produces order-independent canonical hashes.
- **Verification:** `/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_state.gd` passed.
- **Next:** B2-03.

###### B2-03 — Schema v3 Codec and Legacy Migration `[complete 2026-08-17]`

- **Depends on:** B2-02.
- **Scope:** freeze v3 field names; parse/serialize; embed layout snapshots in business saves; implement a deliberate v2-to-v3 migration.
- **Migration rule:** old rectangle corridors become explicit orthogonal segments/courts where unambiguous. Old stores receive a computed frontage only if one unique corridor edge is adjacent; ambiguous stores become flagged legacy lots requiring repair, never silently guessed.
- **Acceptance:** all valid fixtures round-trip; corrupt references fail safely; a copied legacy save loads without losing economy/store stats; migration writes a newer save only after successful validation and retains backup.
- **Do not:** delete old codec paths until migration tests pass.
- **Completed evidence:** added standalone `layout_save_codec.gd` for v3 parse/serialize and legacy v2 blueprint migration tests. Valid v3 fixtures parse and serialize back through `LayoutState` with stable hashes, invalid v3 fixtures fail without returning state, and the captured legacy Aurora snapshot migrates into v3-shaped data with old lots flagged `legacy_repair_required`.
- **Important scope note:** production business saves and the live `main.gd` load path are intentionally unchanged; backup/write behavior belongs in the later integration step, not this standalone codec milestone.
- **Verification:** `/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_save_codec.gd` passed.
- **Next:** B2-04.

###### B2-04 — Orthogonal Corridor Rasterizer and Graph `[ ]`

- **Depends on:** B2-02 and B2-03.
- **Scope:** centerline segments, widths, endpoint snapping, corners, T/cross junctions, occupied cells, public-surface polygons, and reachability graph.
- **Acceptance:** straight/L/T/cross fixtures connect exactly; a 0.1 m visual gap cannot change graph state; overlapping runs merge deterministically; state hashes are order-independent.
- **Performance target:** rebuild a 250-segment test mall graph and occupancy in under 20 ms on desktop development hardware before incremental optimization.

###### B2-05 — Layout Validator and Command Preflight `[ ]`

- **Depends on:** B2-04.
- **Scope:** implement the twelve invariants, structured error codes, affected-object lists, warnings vs blockers, and before/after state preflight.
- **Acceptance:** every invalid fixture is rejected for the expected reason; valid commands return cost/area/change summaries; no failed command mutates layout or cash; demolition detects orphaned stores/entrances.
- **Required error examples:** `OUTSIDE_PARCEL`, `OVERLAPS_LOT`, `NO_START_CONNECTION`, `DOOR_NOT_ON_FRONTAGE`, `ORPHANS_STORE`, `DUPLICATE_ID`, `CURVE_TOO_TIGHT`.

###### B2-06 — Seamless Corridor Renderer `[ ]`

- **Depends on:** B2-04 and B2-05.
- **Scope:** incremental floor, edge trim, corner/junction caps, walls/railings where exposed, material continuity, preview material, and change-set rebuilding.
- **Acceptance:** straight runs, L corners, T junctions, courts, and base-to-player-built joins show no daylight cracks or z-fighting at phone camera distances; renderer never changes topology; deleting one segment rebuilds only affected neighbors.
- **Mobile budget:** one draw-surface/material strategy per theme where practical; avoid one heavy node/material per cell.

###### B2-07 — Mobile Hallway Gesture Controller and Bottom Sheet `[ ]`

- **Depends on:** B2-05; may use simple debug rendering until B2-06 finishes.
- **Scope:** gesture state machine, one-finger draw, two-finger camera arbitration, snap cursor, route candidates, width chips, handles, live cost, Build/Cancel, persistent tool, undo/redo, safe-area bottom sheet.
- **Acceptance:** a tester can draw straight and L-shaped runs, adjust width/endpoints, cancel, confirm, undo, and redo using touch only; no accidental commit occurs during camera gestures; controls meet 44-point minimum at supported resolutions.
- **Automated states:** `IDLE`, `ARMED`, `DRAWING`, `EDITING_PREVIEW`, `COMMITTING`, `CANCELLED`; test allowed transitions and multi-touch cancellation.

###### B2-08 — Lots, Frontage, Doors, and Store Alignment `[ ]`

- **Depends on:** B2-05, B2-06, and B2-07.
- **Scope:** frontage-first lot gesture, rectangle lots, resize/rotate, door slide, storefront renderer orientation, side/back walls, vacancy support, lease compatibility.
- **Acceptance:** north/south/east/west-facing stores all render and route correctly; moving a corridor invalidates or repairs affected frontage explicitly; no store mesh overlaps hallway; existing tenant/store operations work in v3 lots.
- **Regression:** store register/fixture positions transform from lot-local to world coordinates for every facing.

###### B2-09 — Entrance Placement and Public Navigation `[ ]`

- **Depends on:** B2-04, B2-05, and B2-08.
- **Scope:** entrance command/tool, exterior spawn nodes, interior connectors, graph-to-Godot navigation build, door links, route query service, agent reroute after confirmed changes.
- **Acceptance:** shoppers spawn outside, enter through a designated entrance, stay on public corridors/courts, enter stores through doors, and leave through an exit; no path crosses vacant lots; arbitrary valid player hallway runs are used.
- **Safety:** edits pause agent spawning; active agents finish, reroute, or are moved to the nearest valid public point with a logged reason—never silently walk through walls.

###### B2-10 — Cedar Grove Starter Mall Vertical Slice `[ ]`

- **Depends on:** B2-08 and B2-09.
- **Scope:** author Cedar Grove through v3 schema/player-equivalent commands; tune camera start, expansion parcels, initial economy, objectives, amenities, and readable visual rhythm.
- **Acceptance:** passes all invariants; all expansion ports accept a normal first gesture; two entrances are connected; 8–10 lots align to frontage; first objective can be completed touch-only; small mall is clearly asymmetric and has no cinema.
- **Owner preview:** mandatory Godot preview plus screenshots at target iPhone and iPad landscape aspect ratios before replacing the old default.

###### B2-11 — 45-Degree and Gentle-Curve Hallways `[ ]`

- **Depends on:** B2-10 proves orthogonal vertical slice.
- **Scope:** 45° segments, minimum-radius gentle curves, simplified mobile bend handle, curve rasterization, junction geometry, validation, save/load, navigation.
- **Acceptance:** curve endpoints snap seamlessly to orthogonal/45° runs; minimum widths/radii hold; agents route through curves; undo/redo and save/load preserve control points; invalid self-intersections explain themselves.
- **Non-goal:** unrestricted spline editing or desktop-style tangent handles.

###### B2-12 — Courts, Demolition, Construction, and Repair UX `[ ]`

- **Depends on:** B2-10; curves may land before or after.
- **Scope:** rectangular/convex courts, multi-select demolition, required-path protection, construction time, temporary closure, disruption, repair suggestions for invalid frontage.
- **Acceptance:** court-to-hall joins are seamless; demolition preview lists stores/entrances affected; construction zones block/reroute agents; cancel/refund rules are explicit; one-tap “show repair” focuses the failed connection.

###### B2-13 — Blueprint Library and Share-Ready Saves `[ ]`

- **Depends on:** B2-12.
- **Scope:** New/Save As/Duplicate/Rename blueprint, thumbnail capture, metadata, starter vs player-owned separation, export-safe deterministic JSON.
- **Acceptance:** a player can duplicate Cedar Grove, modify it, start a business from it, and retain the custom layout across app relaunch; business state and reusable blueprint remain distinct.
- **Online sharing is not required**, but schema and IDs must not prevent it later.

###### B2-14 — Mobile Performance, Accessibility, and Owner Gate `[ ]`

- **Depends on:** B2-01 through B2-13.
- **Scope:** iPhone/iPad profiling, mesh batching, incremental graph/nav rebuilds, off-screen simplification, touch target audit, safe areas, reduced motion, left-handed UI, color-safe feedback, migration soak.
- **Acceptance:** no progression blocker in a 60-minute touch-only session; representative large mall meets the agreed frame/memory budget; save migration/round-trip passes; five testers can create a non-cross mall with two entrances and valid stores without explanation.
- **Final owner gate:** a tester can create a non-cross-shaped mall, connect two entrances, zone and lease stores, and watch shoppers use only valid hallways—without opening a debug panel or fighting the camera.

##### Per-Milestone Handoff Template

Every B2 agent must append this information to **Section 6** before stopping:

```text
B2 milestone:
Status: not started | in progress | complete | blocked
Files changed:
Schema/save version impact:
Tests added and exact command:
Godot preview command and result:
Touch resolutions tested:
Known limitations (facts, not future ideas):
First incomplete acceptance item:
Recommended next task ID:
```

If a milestone cannot finish in one quota window, split only by its listed deliverables and record the exact first failing acceptance item. Do not invent a parallel architecture, silently change locked geometry decisions, or mark a milestone complete because the game launches.

### Phase C: Economy, Failure, Recovery & Decision Feedback

- [ ] Define one authoritative weekly profit-and-loss model covering rent, revenue share, payroll, maintenance, utilities, marketing, construction, debt, and incident losses.
- [ ] Reconcile cash, reputation, tenant satisfaction, footfall, and lease state so a collapsing mall cannot look financially healthy without an explicit explainable reason.
- [ ] Add pre-action forecasts and tradeoffs: expected cost, affected metric, confidence/range, duration, and downside.
- [ ] Add post-action feedback that names what changed and why; connect weekly statements to world causes and shopper thoughts.
- [ ] Add bankruptcy pressure and recovery options: credit line, refinance, temporary rent relief, emergency campaign, sell amenity, or accept a rescue objective.
- [ ] Add tenant negotiation and departure windows instead of sudden opaque state changes.
- [ ] Add difficulty presets that alter safety margins and event pressure without changing core rules.
- [ ] Build deterministic economy simulation tests for 4-, 12-, and 52-week runs with fixed seeds and invariant checks.
- **Owner gate**: Two different strategies produce visibly different outcomes over 30 minutes, and the player can correctly identify the main reason for profit or loss from the game—not the source code.

### Phase D: Deep Store Vertical Slice & Interior Editor

- [ ] Build a reusable data-driven store module interface owning fixtures, actors, jobs, service flow, upgrades, failure states, metrics, and inspector sections.
- [ ] Add store edit mode with an interior grid, ghost previews, rotation, move/sell, undo, reachability validation, and versioned save/load.
- [ ] Prove the system with one complete restaurant: host/cashier, cook, runner, order point, prep station, pickup, tables, trash/mess, queue, and visible service timing.
- [ ] Make layout, equipment, menu pricing, staffing mix, decor, and cleanliness change throughput, quality, capacity, cost, and guest satisfaction.
- [ ] Add readable bottleneck callouts such as “register line too long,” “cook idle—pickup blocked,” or “no clean table,” with camera focus to the cause.
- [ ] Keep generic stores supported through a fallback module so existing catalog content remains playable during migration.
- **Owner gate**: A player spends 15 minutes improving the restaurant, can watch every service step, and can demonstrate that two interior layouts perform differently.

### Phase E: Staff, Jobs & Physical Incidents

- [ ] Split staff into visible roles with uniforms/tools, schedules, wages, skills, fatigue, assigned zones, and priority queues: security, janitor, maintenance, concierge, cashier/server.
- [ ] Replace auto-resolving abstract incidents with world jobs the player can notice, prioritize, dispatch, or deliberately ignore.
- [ ] Add physical shoplifting: suspect browses, steals, flees through corridors toward an exit; security patrols, alerts, chases, intercepts, catches/escorts, or loses them.
- [ ] Add spills, broken fixtures, trash, lost guests, medical calls, and crowd jams as readable world objects with escalating consequences.
- [ ] Give incidents decision windows, staffing/routing tradeoffs, outcome recaps, and occasional humorous or dramatic character moments.
- **Owner gate**: A player can watch and explain a complete incident from cause through response to business consequence, and their dispatch decision can change the outcome.

### Phase F: Character Readability & Living Mall Presentation

- [ ] Replace the generic capsule body with reusable procedural shopper/staff rigs and a mobile-friendly animation state controller.
- [ ] Add readable idle, walk, browse, queue, pay, sit, eat, talk, clean, repair, serve, chase, and flee states.
- [ ] Give shopper groups, needs, patience, budgets, preferences, memories, and named thoughts tied to specific stores and physical causes.
- [ ] Add group behavior, window-shopping, directory use, photos, shopping bags, food, seating, conversations, and exit satisfaction.
- [ ] Improve the environment with an exterior site/parking context, daylight/closed-hours moods, storefront silhouettes, animated signs, queues, and layered ambience.
- [ ] Add event camera focus and optional follow/inspect mode without taking control away from the player.
- **Owner gate**: With labels disabled, a player can identify staff roles, shopper intent, and the cause of a crowd or complaint by watching the 3D world.

### Phase G: Store Category Packs & Signature Attractions

- [ ] Ship category modules for Food, Cinema/Entertainment, Luxury/Fashion, Tech/Specialty, and Arcade using the Phase D interface.
- [ ] Build a full cinema loop: ticket queue, concessions, auditorium entry, trailers, lights down, screening, credits, cleanup, and exit crowd.
- [ ] Add category-specific customization and tradeoffs:
  - Food: kitchen stations, seating, menu speed/quality, delivery and waste.
  - Cinema: schedules, screen tech, seat tiers, concessions, turnaround time.
  - Luxury/Fashion: displays, fitting rooms, stylists, anti-theft, VIP lounge.
  - Tech: demo tables, repair bar, launch events, stock risk.
  - Arcade: cabinet mix, prize economy, tournaments, jackpots and maintenance.
- [ ] Give every category at least one signature visual moment, one operational bottleneck, one staffing choice, one risky upgrade, and one customization decision.
- **Owner gate**: Testers can name the store category from behavior alone and choose different management tactics for at least three categories.

### Phase H: Campaign, Unlocks & Replayability

- [ ] Turn scenarios into a campaign graph with explicit selection, intro, escalating objectives, failure conditions, victory presentation, rewards, and continue/free-play choice.
- [ ] Make prestige unlock meaningful tenants, fixtures, staff training, architecture themes, financing options, and new starter malls.
- [ ] Add local demand profiles, shopper demographics, seasonal calendars, competitors, and property constraints to differentiate locations.
- [ ] Add optional challenge goals, medals, score breakdowns, and seeded daily/weekly challenge support without requiring online services.
- [ ] Add discoveries/collections such as tenant relationships, signature attractions, design themes, and successful store combinations.
- [ ] Tune pacing so each session alternates planning, observation, pressure, payoff, and breathing room.
- **Owner gate**: A completed scenario creates a clear reason to start another, and testers choose different malls or strategies rather than merely continuing the same save forever.

### Phase I: Production UI, Accessibility, iOS Performance & QA

- [ ] Finish the mode-based UI: Select, Build, Store Edit, Staff, Operations, Data, and Goals, with progressive disclosure and consistent back/cancel behavior.
- [ ] Add accessibility settings: text scale, color-safe overlays, reduced motion, haptics/audio controls, left/right-handed layouts, and readable safe-area behavior.
- [ ] Profile shopper, staff, prop, pathfinding, UI, and animation budgets on representative iPhone/iPad hardware using GL Compatibility.
- [ ] Add pooling, LOD, update throttling, off-screen simulation simplification, and heatmap sampling budgets.
- [ ] Build automated smoke tests for New Game, build validation, lease/open, weekly economy, incident lifecycle, scenario completion, and save/load migration.
- [ ] Add a repeatable human playtest checklist and local diagnostic logging for funnels, dead clicks, confusing screens, frame time, and save failures.
- [ ] Remove debug language and placeholder copy, audit audio/visual consistency, and prepare App Store-compliant settings/privacy surfaces.
- **Owner gate**: The alpha meets its first-session and 60-minute criteria, survives save migration and interruption tests, has no progression blockers, and remains smooth/readable on the target mobile performance budget.

### Architecture Rules For Every Phase

1. **Simulation and presentation stay separate.** Domain state should not live inside UI controls or meshes.
2. **Player actions are commands and outcomes are events.** This enables undo, forecasting, tutorials, replay tests, analytics, and future multiplayer/cloud features.
3. **Content is data-driven.** Stores, fixtures, scenarios, rewards, incidents, shopper types, and starter malls use schemas with validation and versioning.
4. **World jobs drive visible behavior.** Staff and shoppers act on shared jobs/targets rather than category-specific one-off movement hacks.
5. **Saves migrate forward.** Every schema change increments a version and includes a migration or a deliberate compatibility decision.
6. **Every milestone is playable.** Do not merge a data backbone without at least one complete world/UI behavior proving it.

---

## 5. Design Pillars For Future Decisions

1. **The player builds the story.** The mall should begin incomplete and become visibly personal through layout, tenant, and operating choices.
2. **Watchability is the feedback system.** Important numbers must have a visible cause in shoppers, staff, stores, queues, and spaces.
3. **Every decision has a tradeoff.** A choice without cost, risk, opportunity cost, or downstream consequence is not tycoon gameplay.
4. **Every store is a tiny world.** Stores own actors, props, service flow, bottlenecks, and category-specific customization.
5. **Problems invite decisions.** Incidents and failures should create player agency, not only toasts or automatic resolution.
6. **Complexity is earned gradually.** The game reveals depth through objectives and context instead of presenting every system at launch.
7. **Mobile first, deep always.** Touch clarity and performance constrain presentation, not the depth of the simulation.

### Tycoon Reference Lessons

- **RollerCoaster Tycoon / Parkitect**: The fun is drawing paths, seeing queues, reading guest thoughts, and connecting a layout decision to behavior.
- **Two Point Hospital**: A strong campaign teaches one system at a time, then recombines them into escalating operational problems.
- **Project Highrise / SimTower**: Property growth, tenant economics, traffic, and service infrastructure create long-term planning pressure.
- **Mega Mall Story**: Store combinations, prestige, unlocks, and compact scenarios make mall growth collectible and replayable.
- **Cities: Skylines**: Overlays are valuable only when they lead back to visible causes and actionable world edits.
- **Prison Architect / RimWorld**: Jobs, interruptions, named agents, and physical tasks create stories from simulation.
- **Planet Coaster / Planet Zoo**: Building, scenery, guest behavior, and signature attractions provide creative ownership and spectacle.

---

## 6. Session Handoff

- **Last active branch**: `main`
- **Last known status**: Phase A remains partially implemented and playable. Owner priority has moved to Project B2, Mall Layout Builder 2.0. B2 now has completed schema fixtures, pure authoritative layout state, coordinate conversion, state hashing, and a standalone v3 save codec with legacy v2 migration tests. The rasterizer/graph, renderer, mobile builder UI, navigation replacement, and Cedar Grove vertical slice have not started. The current 6×6 hallway builder and Aurora Starter Promenade remain a prototype compatibility path, not an architecture to extend.
- **Most recently completed phase/task**: B2-03 — added standalone schema v3 parse/serialize and conservative legacy v2 migration tests without changing production save/load or `main.gd`.
- **Known partial work**: The prototype still permits “near enough” rectangle connections, infers store frontage from map position, uses isolated tap-to-place tiles, and lacks authoritative graph/nav validation. These are documented replacement targets. Unrelated Phase A safe-area/HUD polish remains incomplete but is not the next owner priority.
- **Recommended next task**: B2-04 — implement the orthogonal corridor rasterizer and reachability graph for centerline segments, widths, endpoint snapping, corners, T/cross junctions, occupied cells, public-surface polygons, and deterministic graph connectivity.
- **Verification command to run next**:
  ```bash
  /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_schema.gd
  /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_state.gd
  /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_save_codec.gd
  ```

B2 milestone: B2-01
Status: complete
Files changed: `godot/scripts/layout/layout_schema.gd`, `godot/tests/layout/test_layout_schema.gd`, `godot/data/layout_fixtures/*.json`, `PROJECT_TRACKER.md`
Schema/save version impact: introduced a v3 validation skeleton and fixtures only; no production saves or legacy load paths were changed.
Tests added and exact command: `godot/tests/layout/test_layout_schema.gd`; run with `/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_schema.gd`
Godot preview command and result: not launched; B2-01 is headless infrastructure with no visual/gameplay change.
Touch resolutions tested: none; no touch UI changed.
Known limitations (facts, not future ideas): schema validation is intentionally structural; graph reachability, frontage adjacency, save round-trip serialization, and command mutation checks begin in later B2 milestones.
First incomplete acceptance item: B2-02 `LayoutState` extraction has not started.
Recommended next task ID: B2-02

B2 milestone: B2-02
Status: complete
Files changed: `godot/scripts/layout/layout_coordinates.gd`, `godot/scripts/layout/layout_state.gd`, `godot/scripts/layout/layout_test_factory.gd`, `godot/tests/layout/test_layout_state.gd`, `PROJECT_TRACKER.md`
Schema/save version impact: no production save changes; pure state uses the v3 object categories established by B2-01.
Tests added and exact command: `godot/tests/layout/test_layout_state.gd`; run with `/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_state.gd`
Godot preview command and result: not launched; B2-02 is non-visual engine infrastructure with no gameplay scene change.
Touch resolutions tested: none; no touch UI changed.
Known limitations (facts, not future ideas): state objects are still dictionaries, not final typed resources; graph reachability, renderer integration, command history, production save migration, and topology validation are not implemented.
First incomplete acceptance item: B2-03 schema v3 codec and legacy migration has not started.
Recommended next task ID: B2-03

B2 milestone: B2-03
Status: complete
Files changed: `godot/scripts/layout/layout_save_codec.gd`, `godot/tests/layout/test_layout_save_codec.gd`, `godot/scripts/layout/layout_schema.gd`, `PROJECT_TRACKER.md`
Schema/save version impact: v3 parse/serialize exists as standalone infrastructure; live save files and old production codec paths are unchanged. Legacy v2 migration currently creates repair-required v3 lots rather than guessing final frontage.
Tests added and exact command: `godot/tests/layout/test_layout_save_codec.gd`; run with `/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --script res://tests/layout/test_layout_save_codec.gd`
Godot preview command and result: not launched; B2-03 is non-visual codec infrastructure with no gameplay scene change.
Touch resolutions tested: none; no touch UI changed.
Known limitations (facts, not future ideas): migration does not yet integrate with business saves, write upgraded files, create backups, or prove full economy/store stat preservation; those require production save integration after topology and validation mature.
First incomplete acceptance item: B2-04 orthogonal corridor rasterizer and graph has not started.
Recommended next task ID: B2-04

---

## 7. Running the Game

To launch the native Godot 3D game locally:
```bash
/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --path godot --resolution 1280x720
```

---

*Last Updated: 2026-08-17 — Aurora Mall Tycoon Engineering Team*
