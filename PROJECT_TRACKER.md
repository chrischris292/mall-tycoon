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

## 5. Development Roadmap & Milestones

- [x] **Milestone 1: Project Architecture & Tracker Initialization**
  - Establish `PROJECT_TRACKER.md` and technical specifications.
- [x] **Milestone 2: JSON Catalogs & Procedural Audio Engine**
  - Implement `godot/data/catalogs.json` with all 15+ tenants and 9 amenities.
  - Implement `godot/scripts/sound_manager.gd` with procedural synthesis.
- [x] **Milestone 3: Deep 3D Store Interiors & Visual Upgrades**
  - Expand `main.gd` to render category-specific interior models (Cinema screens, tables, racks, arcade cabs).
  - Build Tier 1 -> Tier 2 -> Tier 3 visual upgrade transitions.
- [x] **Milestone 4: Concourse Amenities & Placement System**
  - Build 3D models for Fountains, Palms, Benches, Kiosks, Restrooms.
  - Implement interactive placement, demolition, and reputation buffs.
- [x] **Milestone 5: Enhanced 3D Shoppers & Emotive Visuals**
  - Implement multi-state shopper simulation (queuing, dining, cinema showtimes).
  - Add 3D floating revenue labels and thought bubbles.
- [x] **Milestone 6: Mobile-First Glassmorphic HUD & Touch Navigation**
  - Build responsive top HUD, bottom drawer system (Directory, Inspector, Architect, Operations, Feed).
  - Implement smooth 1-finger pan, 2-finger pinch zoom, 2-finger yaw rotation, and tap selection.
- [x] **Milestone 7: Operations, Accounting & Full Save/Load**
  - Weekly financial accounting, daily critic reviews/events, sanitation/security actions.
  - Full game state serialization to `user://aurora_save.json`.
- [ ] **Milestone 8: Shopper Personalities, Commercial Difficulty & Multi-Size Stores**
  - 5 Shopper Personalities (💎 Luxury VIP, 🏷️ Bargain Hunter, 📱 Trendsetter, 🍽️ Foodie/Family, ☕ Casual Stroller) with divergent budgets, price elasticity, and in-store browsing trees (`🤔`, `🏷️`, `👗`, `💸`, `😍`).
  - Mall strategic difficulty: Tenant clustering synergy, duplicate cannibalization penalties (-30%), Mega Anchor foot-traffic halo (+25%), scalable anchor utility rent, and staff payroll burn.
  - Multi-tier store sizing: Mega Anchors (13.5×9.0), Flagships (8.5×6.5), Standard (7.5×6.0), Boutiques/Kiosks (5.2×5.0).
  - Dual-lane atrium fountain avoidance routing (zero water basin clipping) and interactive coin-toss/bench resting.
- [ ] **Milestone 9: Real Tycoon Economy & Tenant Relationships**
  - Add lease contracts with base rent, revenue share, term length, renewal date, rent burden, and tenant satisfaction.
  - Model tenant lifecycle states: prospect, open, trending, struggling, at-risk, closing, replaced.
  - Implement lease negotiation decisions: renew, raise rent, subsidize renovation, replace tenant, or leave vacant.
  - Add weekly tenant statements that explain why each store is winning or failing.
- [ ] **Milestone 10: Shopper Demand, Thoughts & Heatmaps**
  - Expand shopper needs beyond one store visit: hunger, entertainment, comfort, budget, patience, restroom need, and destination intent.
  - Add visible guest thoughts and complaints inspired by RollerCoaster Tycoon and Parkitect.
  - Build diagnostic overlays for foot traffic, spend, satisfaction, cleanliness, security, queues, and dead zones.
  - Feed shopper behavior back into store revenue, tenant satisfaction, reputation, and layout evaluation.
- [ ] **Milestone 11: Mall Design Strategy**
  - Make architecture financially meaningful through anchor halos, dead-zone penalties, wing identity, and escalator/elevator traffic routing.
  - Add adjacency combos: cinema + arcade + food court, luxury + jewelry + beauty, family dining + toy store, tech + cafe + bookstore.
  - Add duplicate cannibalization and category saturation so tenant mix becomes a strategic puzzle.
  - Prepare the data model for multi-floor malls, service corridors, vertical transport, and expansion parcels.
- [ ] **Milestone 12: Staff, Services & Incidents**
  - Add visible janitors, security guards, maintenance techs, and concierge staff with routes and coverage zones.
  - Implement staff fatigue, payroll, response times, and break/service rooms.
  - Add operational incidents: spills, shoplifting, broken escalators, restroom complaints, overcrowded food court, celebrity crowds.
  - Add service overlays showing uncovered dirty/unsafe/broken areas.
- [ ] **Milestone 13: Progression, Campaigns & Scenarios**
  - Add sandbox, career, and challenge modes.
  - Create scenario starts such as "revive a dying 90s mall", "luxury wing expansion", "holiday season crunch", and "transit hub opening".
  - Add prestige tiers: Neighborhood Center -> Regional Mall -> Lifestyle Center -> Destination Mall.
  - Gate unlocks through reputation, cashflow, scenario goals, tenant relationships, and mall size.
- [ ] **Milestone 14: Events, Culture & Live Mall Identity**
  - Add seasonal demand curves: holidays, back-to-school, summer tourism, rainy weekends, tax-refund shopping.
  - Add events and pop-ups: sneaker drop, anime convention, farmers market, fashion show, influencer meet-and-greet.
  - Add local competition and external shocks: nearby outlet mall, e-commerce slump, transit station opening, construction disruption.
  - Add news/review systems that explain reputation shifts and create medium-term player decisions.
- [ ] **Milestone 15: Mobile-First Productization**
  - Convert dense desktop HUD patterns into thumb-friendly iOS modes: Build, Lease, Manage, Data, Goals.
  - Add safe-area handling, readable panel density, scalable tap targets, and modal flows for complex choices.
  - Add settings, save slots, tutorial onboarding, accessibility pass, and performance budgets for iPhone/iPad.
  - Prepare export pipeline, signing notes, icon requirements, and App Store compliance checklist.

---

## 6. Active Multi-Day Implementation Plan

This is the current priority plan. It is ordered so future sessions can resume from the first incomplete item. Each phase should leave the game playable.

### Phase A: Tycoon Data Backbone

- [ ] Add persistent data structures in `godot/scripts/main.gd` for leases, tenant satisfaction, tenant state, weekly profit/loss, shopper thoughts, and overlay metrics.
- [ ] Extend `godot/data/catalogs.json` tenant definitions with lease expectations, preferred adjacencies, disliked adjacencies, prestige tier, rent tolerance, and target shopper personalities.
- [ ] Update save/load to version the new data safely while preserving existing saves.
- [ ] Add a compact debug/status view in the UI so these values can be inspected while testing.
- **Done when**: Existing malls load, each store has a lease/economy state, and weekly accounting shows store-level explanations.

### Phase B: Tenant Contracts & Store Lifecycle

- [ ] Add lease contract generation when a store opens or is loaded from a template.
- [ ] Add weekly tenant satisfaction calculation from traffic, sales, cleanliness, security, adjacency, rent burden, and category saturation.
- [ ] Add tenant lifecycle transitions: trending, stable, struggling, at-risk.
- [ ] Add player actions: renew lease, lower rent, renovate tenant, replace tenant, leave vacant.
- [ ] Add event feed messages for lease warnings and tenant milestones.
- **Done when**: At least one tenant can become at-risk for understandable reasons, and the player can respond with a meaningful economic tradeoff.

### Phase C: Shopper Needs & Guest Thoughts

- [ ] Expand `godot/scripts/shopper.gd` with needs: hunger, comfort, patience, budget, restroom, entertainment, and destination intent.
- [ ] Add personality-specific behavior: Luxury VIPs value prestige and cleanliness, Bargain Hunters dislike premium pricing, Trendsetters chase new/trending stores, Families need food/restrooms/seating, Casual Strollers browse and use amenities.
- [ ] Add thought bubbles and event snippets that state the reason behind satisfaction changes.
- [ ] Feed unmet needs into reputation, dwell time, spend probability, and store ratings.
- **Done when**: Watching shoppers provides actionable clues about mall layout, tenant mix, pricing, and operations.

### Phase D: Heatmaps & Diagnostics

- [ ] Track grid/corridor samples for foot traffic, spend, cleanliness, safety, wait time, and dead-zone score.
- [ ] Add a Data drawer with overlay toggles.
- [ ] Render simple colored floor overlays in Godot without overwhelming mobile performance.
- [ ] Add summary callouts: "dead wing", "food demand unmet", "security coverage weak", "luxury cluster working".
- **Done when**: The player can diagnose why a store is failing without reading raw numbers.

### Phase E: Strategic Layout Rules

- [ ] Implement anchor halo traffic bonuses and distance falloff.
- [ ] Implement adjacency combo bonuses and duplicate/category saturation penalties.
- [ ] Apply layout scoring to shopper routing, store draw, tenant satisfaction, and lease renewal chances.
- [ ] Add UI hints in the Architect/Lease panels showing nearby synergy and cannibalization before placement.
- **Done when**: Moving or replacing stores can visibly change traffic and weekly profit.

### Phase F: Staff & Incidents

- [ ] Add staff units for janitors, security, maintenance, and concierge.
- [ ] Add route assignment and coverage zones along corridors.
- [ ] Add incident spawning based on crowd, cleanliness, security, and maintenance pressure.
- [ ] Add response tasks and consequences if ignored.
- **Done when**: Operations are spatial and visible, not just buttons that adjust percentages.

### Phase G: Progression & Scenario Layer

- [ ] Define scenario metadata in JSON: starting mall, goals, constraints, unlocks, and win/loss conditions.
- [ ] Add goal tracker UI and victory/summary panel.
- [ ] Create at least three scenarios: starter neighborhood mall, revive a dying mall, holiday rush.
- [ ] Add prestige tiers and unlock rules for tenants, amenities, facade styles, and expansion size.
- **Done when**: A new player has a guided reason to keep playing for multiple sessions.

### Phase H: iOS Product Pass

- [ ] Replace dense desktop drawers with mode-based mobile UX: Build, Lease, Manage, Data, Goals.
- [ ] Audit tap target sizes, safe-area behavior, text fit, and camera gestures.
- [ ] Add tutorial prompts for first build, first lease, first incident, first heatmap, and first weekly report.
- [ ] Profile scene complexity and shopper count for mobile performance.
- **Done when**: The game can be demoed as an iPad-first tycoon prototype.

---

## 7. Design Pillars For Future Decisions

Use these pillars to choose between competing implementation options:

1. **Every store is a business relationship.** Tenants should have needs, leverage, expectations, and consequences.
2. **Every hallway is a traffic decision.** Layout should affect who walks where, who spends, and which stores survive.
3. **Every shopper is feedback.** The player should learn by watching guests and reading their thoughts, not only by studying tables.
4. **Every system should be visible.** Cleanliness, safety, popularity, rent stress, and dead zones need clear world/UI feedback.
5. **Mobile first, deep always.** The game should become complex through layers, not through overwhelming panels.

### Tycoon Reference Lessons

- **RollerCoaster Tycoon / Parkitect**: Guest thoughts, bottlenecks, queues, and path design make management legible and emotionally satisfying.
- **Two Point Hospital**: Room quality, staff fatigue, incidents, and funny feedback make operational problems entertaining instead of abstract.
- **Project Highrise / SimTower**: Tenant contracts, rent pressure, vertical expansion, and service infrastructure create long-term planning.
- **Mega Mall Story**: Store combinations, prestige, tenant mix, and unlocks make malls feel collectible and optimizable.
- **Cities: Skylines**: Overlays are essential; complex simulations become playable when the player can see the invisible systems.

---

## 8. Session Handoff Template

At the end of any substantial AI session, update this block or append directly below it.

- **Last active branch**: `main`
- **Last known status**: Roadmap expanded for multi-day tycoon depth planning. Next implementation should begin with Phase A unless the user reprioritizes.
- **Most recently completed phase/task**: Planning update only.
- **Known partial work**: None in this tracker update.
- **Recommended next task**: Implement Phase A data backbone in Godot and verify save/load compatibility.
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
