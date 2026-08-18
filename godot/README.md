# Aurora Mall Tycoon — Godot 3D

This is the native successor to the browser prototype. It targets Godot 4.7.1 with the GL Compatibility renderer so the same project can be developed on macOS and exported through Xcode to iOS.

The first vertical slice includes a fully modeled 3D mall concourse, six category-specific storefronts, modern operations UI, editable per-store pricing/staff/stock/promotions/facades, two explicit mall portals, and shoppers that enter outside a portal, use authored corridor routes, visit a storefront doorway, and leave through the opposite exit.

Open `project.godot` in Godot 4.7.1 and run the main scene, or run from terminal:
```bash
/private/tmp/godot-4.7.1/Godot.app/Contents/MacOS/Godot --path godot --resolution 1280x720
```

Desktop camera controls are right/middle-drag, mouse wheel, and W/A/S/D. Trackpad and iOS-compatible touch/magnify/pan gestures are also wired.


