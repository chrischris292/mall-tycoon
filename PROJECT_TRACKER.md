# Aurora Mall Tycoon — Project Tracker & Architecture Blueprint

This document tracks the end-to-end migration, architecture, and feature evolution of **Aurora Mall Tycoon** as it transitions from the 2D web prototype (`src/`) into a native, high-quality 3D management simulation game built with **Godot 4.7+** (`godot/`) targeting iOS and desktop platforms.

Future AI agents and developers should read and update this file as new features and iterations are implemented.

### Resumable AI Development Protocol

This project is expected to evolve over many Codex sessions and quota windows. Every AI/developer session should follow this protocol before implementing:

1. Read this tracker first, especially Sections 5, 6, and 8.
2. Check `git status --short --branch` and avoid overwriting uncommitted work.
3. Pick the first incomplete task from the **Active Multi-Day Implementation Plan** unless the user gives a newer priority.
4. Implement one coherent vertical slice at a time: data model, simulation behavior, UI affordance, save/load, and visual feedback where applicable.
5. Before stopping, update this tracker with completed tasks, current branch/commit if committed, known partial work, and the recommended next task.
6. Verify in proportion to the change. For Godot work, at minimum run a headless parse/editor quit when possible:
   ```bash
   /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --editor --quit
   ```
7. Keep the native Godot project as the primary game. The React/Vite prototype remains a reference for product ideas and parity checks.

---

## 1. Project Vision & Targets

- **Platform Target**: iOS (iPhone & iPad with touch/gesture controls, notch/safe-area support) and macOS/Desktop.
- **Engine / Renderer**: Godot 4.7+ utilizing the **GL Compatibility** renderer for maximum mobile performance and cross-platform compatibility.
- **Aesthetic**: High-end modern commercial architecture, sleek glassmorphism UI, warm ambient interior lighting, neon storefront accents, PBR materials, and lively stylized 3D shoppers with emotive visual feedback.
- **Core Loop**:
  1. **Architect & Design**: Zone commercial lots, lay custom concourse flooring (Carrara marble, terrazzo, dark granite, chevron wood), install glass railings, and place concourse amenities (dancing fountains, palm planters, coffee carts, ATM kiosks).
  2. **Curate & Lease**: Attract luxury fashion houses, gourmet dining, artisan cafes, IMAX cinemas, and retro cyber arcades from a rich catalog.
  3. **Manage & Optimize**: Set pricing strategies (Value/Market/Premium), hire service teams, restock inventory, launch local marketing blitzes, renovate storefront facades, and upgrade stores through Tier 1 → Tier 2 → Tier 3.
  4. **Concourse & Operations**: Dispatch sanitation buffing crews, deploy security patrols, manage weekly accounting statements, and respond to daily critic reviews and festivals.

---

## 2. Feature Parity & Migration Status Matrix

| Feature Domain | HTML Prototype (`src/`) | Godot 3D Native (`godot/`) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Mall Blueprints & Templates** | 5 templates (Aurora Grand, Cedar Grove, Lakeside, Metropolitan, Blank) | Aurora Grand (Expanded JSON) + Template loader | 🟢 Complete | Dynamic multi-template loading & custom zoning |
| **Tenant Catalog (15+ Stores)** | 5 Categories (Luxury, Food, Fashion, Entertainment, Specialty) | Full JSON catalog in `catalogs.json` with 15+ stores & tiers | 🟢 Complete | Full metadata, 3-tier upgrade trees, signature items |
| **Concourse Amenities (9 Items)** | Fountains, Palms, Benches, ATM, Boba, Bistro, Restrooms, Info | 3D Fountains, Palms, Benches, Kiosks, Restrooms | 🟢 Complete | 3D models with water effects, shopper interaction |
| **Shopper State Machine** | 12 States (Queueing, Ordering, Dining, Cinema, Rest, Amenities) | Entering, Concourse, Queuing, Browsing, Dining, Exiting | 🟢 Complete | Full multi-state simulation with 3D bubbles & floaters |
| **Deep Store Simulations** | Cinema 4-phase showtimes, Bakery ovens, Keynote stages, Arcade jackpots | Cinema lifecycle, Bakery batches, Tech demo cycles | 🟢 Complete | Dynamic timers, visual glows, audio feedback |
| **Store Operations & Management** | Pricing, Staffing, Restocking, Promotions, Facade Styles, Upgrades, Eviction | Pricing, Staffing, Restocking, Promotions, Facades, Upgrades | 🟢 Complete | Full inspector UI drawer & 3D visual upgrades |
| **Mall Operations & Health** | Cleanliness, Security, Reputation, Weekly Accounting, Daily Events | Cleanliness, Security, Reputation, Accounting, Events | 🟢 Complete | Dedicated Operations HUD drawer & notifications |
| **Audio Engine** | Web Audio API procedural synthesis (6 sound types) | Godot `AudioStreamGenerator` procedural audio system | 🟢 Complete | Native self-contained sound effects & ambient sound |
| **iOS Camera & Touch Controls** | Mouse pan/zoom, basic gestures | 1-finger pan, 2-finger pinch zoom, 2-finger yaw orbit, tap-to-select | 🟢 Complete | Native Godot touch & screen drag event integration |
| **Save / Load System** | `localStorage` JSON document | `user://aurora_save.json` serialization | 🟢 Complete | Full state, custom amenities, zoned lots, upgrades |

---

## 3. Architecture & File Structure

```
mall-tycoon/
├── PROJECT_TRACKER.md              # THIS FILE — Master progress & technical tracker
├── README.md                       # High-level repository overview
├── godot/                          # Native Godot 3D Game Project
│   ├── project.godot               # Godot project configuration (GL Compatibility, input maps)
│   ├── export_presets.cfg          # iOS / macOS export configuration
│   ├── data/                       # Data-driven JSON catalogs & blueprints
│   │   ├── catalogs.json           # All tenant, amenity & template definitions
│   │   ├── aurora_grand.json       # Flagship showcase mall blueprint
│   │   └── templates/              # Additional mall starter templates
│   ├── scenes/
│   │   └── main.tscn               # Master 3D scene (WorldEnvironment, Sun, CameraRig, UI CanvasLayer)
│   └── scripts/
│       ├── main.gd                 # Master controller: 3D generation, UI, input & loop orchestration
│       ├── shopper.gd              # Stylized 3D shopper agent with state machine & visual feedback
│       └── sound_manager.gd        # Procedural audio generator & sound effects synthesizer
└── src/                            # Original React/Vite 2D Prototype (preserved as reference)
    ├── game/                       # Core simulation engine, types & constants
    └── components/                 # UI components, canvas renderer & sidebars
```

---

## 4. Technical Design Specifications

### A. 3D Architectural Generation & Materials
- **Concourse Floors**: Generated as segmented 3D slabs with PBR materials (roughness 0.18-0.3, metallic 0.1-0.24, normal/albedo variations for marble, terrazzo, wood, and outdoor stone).
- **Storefronts**: Dynamic 3D structures featuring glass curtain walls (`transparency = alpha`, high specular), illuminated category signage (`Label3D` with billboard mode), and interchangeable facade headers (Gallery, Warm Wood, Neon Glow).
- **Store Interiors**: Context-aware procedural furnishing:
  - *Food / Dining*: Service counters, glass display cases, dining tables with stools/booths.
  - *Entertainment / Cinema*: Tiered stadium seating with velvet recliners, curved IMAX screen with animated emission glow.
  - *Technology*: Demonstration benches with glowing smart devices and OLED video walls.
  - *Fashion / Luxury*: Merchandising racks, mannequins, gold trim, and private fitting suites.
  - *Arcade*: Glowing neon arcade cabinets and prize counters.

### B. Stylized 3D Shoppers & Visual Feedback
- **Character Meshes**: Stylized low-poly avatars with color-blocked clothing, expressive skin/hair variations, and accessories (shopping bags, iced drinks, popcorn tubs).
- **Floating 3D FX**:
  - Floating coin/cash text (e.g. `+$72`) spawned in 3D world space, floating upwards with alpha fade.
  - 3D Billboard Thought Bubbles: Popups displaying purchase satisfaction (❤️), film reels (🎬), coffee (☕), boba (🧋), or tech (◈).

### C. Procedural Sound System
- Generates pure mathematical audio waveforms via `AudioStreamWAV` in GDScript:
  - `play_cash()`: Fast ascending dual-tone chime (1318Hz -> 1661Hz).
  - `play_place()`: Harmonious chord (440Hz -> 587Hz -> 880Hz).
  - `play_upgrade()`: Majestic 4-note fanfare (523Hz -> 659Hz -> 784Hz -> 1046Hz).
  - `play_doorbell()`: Two-tone chime (880Hz -> 698Hz).
  - `play_error()`: Low sawtooth buzz (220Hz -> 174Hz).
  - `play_arcade()`: Fast 3-tone retro square wave blip.

---

## 5. Current Project: Player-Ready Alpha

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

## 6. Active Multi-Day Implementation Plan

This is the only active plan. Work from the first incomplete phase unless the user sets a newer priority. Each phase must preserve existing features, update save migrations, add proportional automated checks, and finish with a Godot preview plus a short owner playtest note.

### Phase A: New Game, First Ten Minutes & UI Triage

- [ ] Add a launch flow with **New Game**, **Continue**, **Scenarios**, and **Settings**. Never auto-load a save without player intent.
- [ ] Add versioned save slots, an explicit fresh-start path, autosave, and a recoverable backup save.
- [ ] Start New Game paused in a healthy small mall with a controlled budget, a few open stores, clear vacant lots, and no immediate failure cascade.
- [ ] Build a guided first objective chain: inspect entrance traffic → lease a tenant → open/store observe → fix one stock or staffing issue → collect first weekly result.
- [ ] Replace tutorial toasts with contextual callouts anchored to the relevant world object or control; allow skip/replay.
- [ ] Triage the HUD into three layers: always-visible essentials, contextual selected-object actions, and optional management modes. Collapse or hide the drawer when nothing is selected.
- [ ] Add a clear current objective card and one recommended next action without removing sandbox freedom.
- [ ] Make UI layout responsive to safe areas, window aspect ratio, and iPhone/iPad touch sizes instead of relying on fixed 1280×720 coordinates.
- **Owner gate**: Five first-time testers can reach the first positive weekly result in under 10 minutes without verbal help, and at least four can explain why their result changed.

### Phase B: Mall Creation & Expansion As The Core Fantasy

- [ ] Create a command-based build system with selection, placement preview, confirm/cancel, undo/redo, demolition, and a transaction history.
- [ ] Let players draw and edit hallway tiles/segments, connect courts, zone/rescale store lots, and place designated mall entrances/exits.
- [ ] Validate every edit: entrances connect to corridors, stores expose a public door to a corridor, agents never route through lots, and required paths cannot be demolished.
- [ ] Add land parcels/expansion zones so small, medium, and large starter malls grow over time instead of starting complete.
- [ ] Add construction cost, construction time, disruption, and temporary path closure so layout decisions have tradeoffs.
- [ ] Turn the existing templates into authored starts with distinct constraints, local demand, budgets, and expansion opportunities.
- [ ] Add blueprint save/duplicate/share-ready serialization separate from the running business save.
- **Owner gate**: A tester can create a non-cross-shaped mall, connect two entrances, zone and lease stores, and watch shoppers use only valid hallways—without entering a debug-style data panel.

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

## 7. Design Pillars For Future Decisions

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

## 8. Session Handoff Template

- **Last active branch**: `main`
- **Last known status**: Owner playtest completed on the native Godot build. The engine is viable, but the project is not yet a player-ready game. The active plan has been reordered around first-session comprehension, mall creation, meaningful economy feedback, one deep store vertical slice, and only then the broader realism/content pass.
- **Most recently completed phase/task**: Player-ready alpha product review and roadmap rewrite.
- **Known partial work**: Single auto-loaded save, no New Game shell, passive tutorial/event toasts, fixed-resolution dense UI, contradictory economy signals, generic store controls, amenities-only architect mode, auto-resolving incidents, generic characters, and scenario data without campaign progression.
- **Recommended next task**: Start Phase A with the launch flow and clean New Game path. Preserve the current save as Continue, add a fresh small-mall start, then implement the first guided objective chain before adding new character art.
- **Verification command to run next**:
  ```bash
  /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --log-file /private/tmp/aurora-alpha-phase-a.log --editor --quit
  ```

---

## 9. Running the Game

To launch the native Godot 3D game locally:
```bash
/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --path godot --resolution 1280x720
```

---

*Last Updated: 2026-08-17 — Aurora Mall Tycoon Engineering Team*
