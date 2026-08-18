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

## 5. Current Project: Living Mall Realism Pass

The previous systems pass is complete enough to stop treating it as the active plan. The new project is to make Aurora Mall Tycoon feel like a living 3D mall, not a set of static boxes with management panels. Future sessions should prioritize animation, readable characters, store-specific gameplay, and gamer-facing customization over adding more abstract numbers.

### Design Target

- **Stores should be miniature attractions.** A movie theater should visibly sell tickets, seat guests, dim lights, run trailers, start a film, and release a crowd. A restaurant should have hosts, cooks, servers, tables, dishes, mess, and bottlenecks. A luxury shop should have display cases, fitting rooms, clerks, VIP visitors, and theft risk.
- **Staff should look and behave like staff.** Security, janitors, servers, cashiers, concierge, and maintenance workers need uniforms, tools, roles, route logic, and animations.
- **Incidents should be physical events.** If someone steals, they should become a visible suspect, security should chase them, and the outcome should depend on pathing, distance, staffing, and crowding.
- **Customization should be game content.** Players need meaningful choices inside each store: layout, counters, displays, service points, registers, kitchens, screens, lighting, staffing stations, decor themes, and premium upgrades.
- **UI should support creative editing.** Management UI should feel like a clean game tool with Build, Decorate, Staff, Operations, Data, and Store Editor modes rather than giant dense debug drawers.

---

## 6. Active Multi-Day Implementation Plan

This is the only active implementation plan. It is ordered so future sessions can resume from the first incomplete item. Each phase must leave the game playable and include a Godot preview when completed.

### Phase A: Character Visual Upgrade & Animation Foundation

- [ ] Split character visuals into reusable procedural rigs/components for shoppers and staff instead of one generic capsule body.
- [ ] Give staff distinct uniforms, badges, hats/tools, and role silhouettes: security, janitor, maintenance, concierge, cashier/server.
- [ ] Add animation states shared by shoppers/staff: idle, walk, browse, queue, pay, sit, eat, talk, clean, repair, chase, flee, serve.
- [ ] Add simple footstep/bob/tween animation controller with speed-based pose changes.
- [ ] Add character labels only as optional debugging; normal gameplay should rely on visual identity.
- **Done when**: A player can identify staff roles and shopper activity from the 3D world without opening UI.

### Phase B: Physical Security Incidents & Chases

- [ ] Replace abstract shoplifting incidents with visible suspect agents spawned from stores or exits.
- [ ] Add suspect states: browsing suspiciously, stealing, fleeing, caught, escaped.
- [ ] Add security states: patrol, alerted, chase, intercept, escort.
- [ ] Add chase routing along corridors only, with catch chance based on distance, crowding, security staffing, and exit proximity.
- [ ] Add visible outcome feedback: handoff/escort animation, escaped suspect notification, recovered/lost cash.
- **Done when**: A shoplifting event creates a visible chase that the player can watch and understand.

### Phase C: Restaurant Service Simulation

- [ ] Add restaurant-specific actors: cashier/host, kitchen cook, server/runner.
- [ ] Add physical service stations: order counter, kitchen/prep area, pickup pass, dining tables, trash/mess points.
- [ ] Add shopper dining flow: queue, order, wait, receive food, sit, eat, leave mess, rate experience.
- [ ] Add bottlenecks: not enough cashiers, not enough cooks, dirty tables, no seating, slow service.
- [ ] Add customization controls for restaurants: counter count, kitchen upgrade, table layout, menu pricing, decor theme, staffing mix.
- **Done when**: Food stores feel operational and players can improve them through layout/staff/equipment choices.

### Phase D: Movie Theater Show Cycle

- [ ] Replace static cinema glow with a full showtime loop: ticket sales, lobby queue, concession purchase, auditorium entry, trailer, movie, credits, exit crowd.
- [ ] Add visible theater elements: box office, concession stand, auditorium doors, screen, seats, posters/showtime board.
- [ ] Animate lights dimming, screen color changes, trailer/movie phases, and crowd release.
- [ ] Add gameplay controls: ticket price, show schedule frequency, concession quality, screen upgrade, seating tier, staffing.
- [ ] Add failure modes: long ticket lines, dirty auditorium, missed showtime, underfilled screening.
- **Done when**: The cinema is an attraction the player can watch and tune, not just a store with a glowing screen.

### Phase E: Store Interior Customization Engine

- [ ] Create a data-driven store layout model for editable interior objects: fixtures, registers, service counters, shelves, tables, screens, decor, staff stations.
- [ ] Add per-store edit mode with placement grid inside the lot footprint.
- [ ] Add object categories: revenue fixtures, service fixtures, comfort/decor, operational stations, queue guides.
- [ ] Add constraints and validation: doors stay clear, staff can reach stations, shoppers can path to fixtures/registers/seats.
- [ ] Add save/load support for customized interiors.
- **Done when**: At least one store can be edited internally and its layout changes shopper/staff behavior.

### Phase F: Store Category Gameplay Packs

- [ ] Define category modules for Food, Cinema/Entertainment, Luxury/Fashion, Tech/Specialty, Arcade.
- [ ] Each module should own its actors, props, service flow, upgrade choices, failure states, and animations.
- [ ] Add category-specific customization:
  - Food: kitchen stations, tables, menu board, speed/quality tradeoff.
  - Cinema: auditorium seats, concession, posters, screen tech, show schedule.
  - Luxury/Fashion: display cases, fitting rooms, stylists, anti-theft gates, VIP lounge.
  - Tech: demo tables, repair bar, launch stage, product wall.
  - Arcade: cabinets, prize counter, tournament stage, jackpot machine.
- [ ] Add UI inspector sections generated from the category module instead of one generic store panel.
- **Done when**: Different store categories have visibly different gameplay and customization decisions.

### Phase G: UI Redesign For Creative Management

- [ ] Replace the current dense drawer stack with a cleaner mode-based UI: Select, Build, Store Edit, Staff, Operations, Data, Goals.
- [ ] Add a contextual store editor panel with tabs: Layout, Staff, Pricing, Upgrades, Decor, Issues.
- [ ] Add icon buttons, compact toolbars, object palettes, and clearer mobile-friendly touch targets.
- [ ] Add visual selection outlines and ghost previews for placeable objects.
- [ ] Add issue cards that point to physical causes: "register line too long", "server cannot reach table", "security too far from luxury wing".
- **Done when**: Editing stores and responding to problems feels like a polished game workflow rather than a debug menu.

### Phase H: Mall Atmosphere & Environmental Life

- [ ] Add ambient mall behaviors: groups chatting, window-shopping, sitting, looking at directory, taking photos, carrying bags/food.
- [ ] Add lighting moods: morning, afternoon, evening, closed-hours cleaning, cinema glow, restaurant warmth.
- [ ] Add store exterior improvements: animated signs, window displays, open/closed indicators, queues visibly outside entrances.
- [ ] Add richer sound hooks: crowd murmur, cleaning, register beeps, cinema trailer rumble, restaurant kitchen sounds, arcade ambience.
- [ ] Add camera polish: smooth follow/inspect mode, cinematic event focus for incidents and major store moments.
- **Done when**: The mall feels alive even when the player is not clicking anything.

### Phase I: Balancing, Performance & iOS Readiness

- [ ] Profile shopper/staff/prop counts on the GL Compatibility renderer and set budgets for iPhone/iPad.
- [ ] Add LOD/simplification rules for characters, props, thought bubbles, and animations.
- [ ] Add scenario playtest checklist: frame rate, readability, UI fit, tap accuracy, save/load stability.
- [ ] Tune event frequencies so the game feels busy but not chaotic.
- [ ] Update `PROJECT_TRACKER.md` after each completed phase with verification and preview notes.
- **Done when**: The richer simulation remains smooth and readable on the target mobile performance budget.

---

## 7. Design Pillars For Future Decisions

Use these pillars to choose between competing implementation options:

1. **Every store is a tiny world.** A store should have actors, props, service flow, visible bottlenecks, and category-specific customization.
2. **Every incident is physical.** Theft, mess, repairs, and crowds should appear in the world and be solved by visible staff behavior.
3. **Every character reads at a glance.** Shoppers and staff need silhouettes, tools, uniforms, animations, and intent.
4. **Every customization changes behavior.** Counters, displays, tables, registers, screens, decor, and staff stations must alter routing, revenue, satisfaction, or risk.
5. **Mobile first, alive always.** The richer simulation must remain readable and performant on iPhone/iPad.

### Tycoon Reference Lessons

- **RollerCoaster Tycoon / Parkitect**: Guest thoughts, bottlenecks, queues, and path design make management legible and emotionally satisfying.
- **Two Point Hospital**: Room quality, staff fatigue, incidents, and funny feedback make operational problems entertaining instead of abstract.
- **Project Highrise / SimTower**: Tenant contracts, rent pressure, vertical expansion, and service infrastructure create long-term planning.
- **Mega Mall Story**: Store combinations, prestige, tenant mix, and unlocks make malls feel collectible and optimizable.
- **Cities: Skylines**: Overlays are essential; complex simulations become playable when the player can see the invisible systems.
- **Prison Architect / RimWorld**: Small agent stories, jobs, interruptions, and physical tasks make simple visuals feel alive.
- **Planet Coaster / Planet Zoo**: Guests, shops, staff, queues, and scenery become compelling when the player can see cause and effect in-world.

---

## 8. Session Handoff Template

At the end of any substantial AI session, update this block or append directly below it.

- **Last active branch**: `main`
- **Last known status**: The old A-H systems plan has been removed from the active plan. The new active project is the Living Mall Realism Pass, focused on visual richness, animation, physical incidents, store-specific service flows, and gamer-facing customization.
- **Most recently completed phase/task**: Planning update only for the new project.
- **Known partial work**: Current implementation still has boring/static stores, generic shoppers/staff, abstract incidents, and limited store customization. These are now first-class problems in the active plan.
- **Recommended next task**: Start Phase A: Character Visual Upgrade & Animation Foundation. Build reusable character rigs/components before adding chases or store service actors.
- **Verification command to run next**:
  ```bash
  /private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --headless --path godot --editor --quit
  ```

---

## 9. Running the Game

To launch the native Godot 3D game locally:
```bash
/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --path godot --resolution 1280x720
```

---

*Last Updated: 2026-08-17 — Aurora Mall Tycoon Engineering Team*
