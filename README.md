# Aurora Mall Tycoon

Aurora Mall Tycoon is moving from its validated browser prototype to a native, data-driven 3D game built with Godot 4.7.1.

## Projects

- `godot/` is the active native game. Its first vertical slice includes a modeled mall, explicit entrance/exit portals, corridor-only visitor routes, category-specific storefronts, per-store operations, touch camera controls, and an iOS export preset.
- `src/` is the complete React/Vite prototype retained as a product and systems reference. The final prototype is checkpointed on GitHub `main` before the native migration begins.

## Run the native game

Open `godot/project.godot` in Godot 4.7.1 and run the project. The scene uses the GL Compatibility renderer because Godot's iOS simulator support requires it and it gives this management game a pragmatic mobile performance baseline.

The mall itself is loaded from `godot/data/aurora_grand.json`. Corridors, stores, and entrances are authored data rather than scene-specific assumptions, establishing the save/template boundary for the future in-game mall editor.

Desktop controls are right/middle-drag, mouse wheel, and W/A/S/D. Touch rotation and pinch zoom are handled through Godot screen events. Storefronts can be selected in the world or from the bottom dock.

## iOS

The project includes an iOS export preset with a placeholder bundle identifier. App Store Team ID, signing, icons, and final privacy declarations must be configured in Godot/Xcode for the shipping application.

