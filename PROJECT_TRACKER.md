# Aurora Mall Tycoon — Project Tracker & Architecture Blueprint

This document tracks the end-to-end migration, architecture, and feature evolution of **Aurora Mall Tycoon** as it transitions from the 2D web prototype (`src/`) into a native, high-quality 3D management simulation game built with **Godot 4.7+** (`godot/`) targeting iOS and desktop platforms.

Future AI agents and developers should read and update this file as new features and iterations are implemented.

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




## 6. Running the Game

To launch the native Godot 3D game locally:
```bash
/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --path godot --resolution 1280x720
```

---

*Last Updated: 2026-08-17 — Aurora Mall Tycoon Engineering Team*

