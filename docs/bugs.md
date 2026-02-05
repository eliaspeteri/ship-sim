# Bugs

- [x] ship's motion does not match wave motion
- [x] when I alt-tab out, or make the tab not visible, the websocket stays connected. But when I alt-tab back in, the connection seems to be cycled. This causes the frontend to kick me back into spectator view. This can be quite jarring. It should put me back into player mode.
  - Note: switching browser tabs triggers spectator mode even without disconnect/reconnect logs.

```sh
Socket disconnected: admin (cmkjjos9a0000u0u8s5dmmo3d)
Socket connected: admin (cmkjjos9a0000u0u8s5dmmo3d) role=player space=global
Loaded weather state for space global
Loading chat history for channel space:global:global
Loaded 0 chat messages for channel space:global:global (hasMore: false)
```

- [x] the Gerstner waves have a diamond pattern. Pattern is not random enough. My hunch is, there aren't enough waves occurring in different directions.
- [x] When I load the "Vessels" tab in the hud drawer, I get an "Authentication required" error message in browser console.

```sh
 Failed to load fleet Error: Authentication required
    loadFleet webpack-internal:///(pages-dir-browser)/./src/components/HudDrawer.tsx:1011
<anonymous code>:1:145535
    overrideMethod <anonymous code>:1
    nextJsHandleConsoleError \IDrive-Backup\code\github\web\ship-sim\node_modules\next\dist\next-devtools\userspace\pages\pages-dev-overlay-setup.js:80
    loadFleet \IDrive-Backup\code\github\web\ship-sim\src\components\HudDrawer.tsx:1048
```

- [x] Same "Authentication required" error as above, but when clicking "Missions" tab in hud drawer.

```sh
 Failed to load economy summary Error: Authentication required
    loadEconomy webpack-internal:///(pages-dir-browser)/./src/components/HudDrawer.tsx:954
<anonymous code>:1:145535
    overrideMethod <anonymous code>:1
    nextJsHandleConsoleError \IDrive-Backup\code\github\web\ship-sim\node_modules\next\dist\next-devtools\userspace\pages\pages-dev-overlay-setup.js:80
    loadEconomy \IDrive-Backup\code\github\web\ship-sim\src\components\HudDrawer.tsx:1001
```

- [x] Same as above but when I open the weather tab. Weather controls seem to work normally, at least on the frontend. Events don't seem to be loading and I'm unable to create new ones.

```sh
 Failed to load environment events Error: Request failed: 401
    loadEvents webpack-internal:///(pages-dir-browser)/./src/components/EnvironmentControls.tsx:197
<anonymous code>:1:145535
    overrideMethod <anonymous code>:1
    nextJsHandleConsoleError \IDrive-Backup\code\github\web\ship-sim\node_modules\next\dist\next-devtools\userspace\pages\pages-dev-overlay-setup.js:80
    loadEvents \IDrive-Backup\code\github\web\ship-sim\src\components\EnvironmentControls.tsx:155
```

- [x] Unable to load `/spaces` page.

```sh
Failed to load spaces Error: Request failed with status 401
    fetchSpaces webpack-internal:///(pages-dir-browser)/./src/pages/spaces.tsx:78
    useEffect webpack-internal:///(pages-dir-browser)/./src/pages/spaces.tsx:109
```

- [x] Unable to load `/admin` page.

```sh
Failed to load metrics Error: Request failed: 401
    fetchMetrics webpack-internal:///(pages-dir-browser)/./src/pages/admin.tsx:101
    useEffect webpack-internal:///(pages-dir-browser)/./src/pages/admin.tsx:380
```

```sh
Failed to load logs Error: Request failed: 401
    fetchLogs webpack-internal:///(pages-dir-browser)/./src/pages/admin.tsx:121
    useEffect webpack-internal:///(pages-dir-browser)/./src/pages/admin.tsx:381
```

```sh
Failed to load moderation Error: Request failed: 401
    fetchModeration webpack-internal:///(pages-dir-browser)/./src/pages/admin.tsx:164
    useEffect webpack-internal:///(pages-dir-browser)/./src/pages/admin.tsx:382
```

- [x] Unable to load `/economy` page due to "Authentication required" error.

- [x] Unable to load `/profile` page.

```sh
Failed to load settings Error: Authentication required
    loadSettings webpack-internal:///(pages-dir-browser)/./src/pages/profile.tsx:108
    useEffect webpack-internal:///(pages-dir-browser)/./src/pages/profile.tsx:127
```

- [x] Navigation tab in hud drawer blocks the whole screen. Tab should be spread to full width of the viewport. We could also extract some things like the controls and crucial indicators (rudder, telegraph lever, ballast, rudder angle indicator) out of this tab, and they should be fixed on the screen. This tab should then only have informational data such as the location and speed.
- [x] Crew & Stations is currently in the navigation tab. It should be its own tab. It also should not be visible if I'm not in player mode.
- [ ] ECDIS is pretty cool but broken. It seems the view is split in two, where the upper view takes two thirds, and is not movable or scrollable. There's an identical view that takes up the last bottom third, and is movable and scrollable. It also has the EBLs, VRMs but I find it difficult to use them, because when I move the mouse on the bottom third view, a bar that shows latitude and longitude is visible and updates. It pushes the EBL + VRM buttons up. When I focus mouse on the buttons, the lat/lon bar disappears, which moves the buttons lower and out of focus. If the cursor is just between these two, it causes the state to flip on every frame, causing the location bar to jitter in and out of view, causing the buttons to move up and down constantly.
- [ ] Deleting a waypoint in ECDIS currently doesn't seem to do anything.
- [ ] ECDIS nav bar doesn't change view. This either is broken or not implemented.
- [ ] ECDIS measurement tool doesn't work.
- [ ] When I hold down the shift or gain buttons in the echo sounder, after some time it should keep scrolling the view in fixed steps, or adjusting gain in fixed steps, in the given direction (lower or higher). Single stepping should also still work if I just click the buttons once.
- [x] echo sounder should have a dark background in the hud tab.
- [x] radar view and radar controls should be side-by-side in the Radar tab.
- [x] Physics params in admin tab should be moved into a new Debug tab.
- [x] Camera heading indicator's height on screen seems to be linked to the hud drawer tab's height. When the hud drawer is closed, the camera indicator is in its normal place. When I open a tab, it moves up to match the tab's height + some offset. So when a tab is really tall, it pushes the camera heading indicator out of view.
- [x] When I'm in admin mode, and I drag a vessel, then enter it, its position does not seem to have changed. Same happens if I change its position through the admin tab in the hud drawer, and then enter the vessel as player.
- [ ] Vessel's load in at lat:0, lon:0. Their position does not seem to be loaded from the db, because as soon as I enter the vessel while at lat/lon 0, this position is likely persisted.
- [ ] The vessel heading is not clear to me. When I'm in spectator mode, every vessel loads in at heading 90 (checked from conning tab). Azimuth is shown as 0. In navigation tab COG is shown as 50 degrees with SOG 0.8 kts and STW 0.3 kts. Compass rose in the dashboard seems to agree with the heading in the conning tab.
- [ ] In the conning tab I see wind speed correctly but wind direction is 90 degrees, while in the weather tab it shows as 0 degrees.
- [ ] Wind data in dashboard does not reflect what the conning or weather tabs show.
- [ ] Comparing ship's visual motion against conning data, conning shows the ship's pitch oscillating but visually it looks more like the ship is rolling.
- [ ] AI integrator causes heavy ships to oscillate wildly in calm water. Intended behavior: if crew is gone, AI should just maintain trajectory / stop safely without roll, pitch, or heave.
- [ ] I can move around a vessel as admin in spectator mode, but I am unable to access the callout popup because the drag handle is very large for small vessels. This doesn't seem to be based on the camera zoom level or vessel's size. It's just a fixed size bubble.
- [x] When I drag a vessel as admin in spectator mode, there is a "copy" of the vessel rendered at its original position. This copy seems to be created when I alt-tab in and out of the window.
- [ ] Comparing against the Three.js axis debug lines, it seems like when my ship visually points south (away from blue line), the heading reads as 0. Course has not changed from 45 degrees.
- [ ] When yaw rate is positive, the ship is visually turning clockwise correctly, but the heading is decreasing.
- [x] In `/vessels` page, none of the persisted vessels are showing up, even when I'm admin, and viewing global space vessels.
- [ ] When I spawn into map editor for a pack, camera is facing 135 degrees. Let's change it to 45 degrees so the world is right side up. Nothing is loaded immediately, only when I start zooming out.
- [ ] Editor should remember last camera focus point, and return to it when the map pack is loaded. Alternatively, it should focus on the first work area in the list (assumed primary).
- [ ] There's no ocean in the editor mode. It's just terrain + black void.
- [ ] When I press "focus" on a work area in the editor, it should set the camera distance to be about 2x the work area radius. So if the radius is 1000 meters, the camera should be 2000 meters away from the work area, and focused on work area center as it currently is.
- [ ] I'm unable to change layer order in editor.
- [ ] Publishing a map pack does not seem to do anything or take me anywhere.
- [ ] Terrain data is not detailed enough. Currently using 1:10 NaturalEarth land data, but it does not have full and accurate coverage.
- [ ] Ocean missing specular reflections, highlights.
- [ ] No HTTPS, at least in dev.
- [ ] `/globe` is just a globe. It currently has no relation to the ship-sim economy or the world or the platform. It could be a 2D tiling map where user can browse ports and vessels currently on the global space.
- [x] In radar display the text is hidden partially. We can remove the text for now.
- [x] Radar controls should be made more compact.
- [x] EBL and VRM in the radar don't seem to do anything.
- [x] PERCENT_SCALE is not defined (when trying to open Systems panel)

```sh
ReferenceError: PERCENT_SCALE is not defined
    HudSystemsPanel webpack-internal:///(pages-dir-browser)/./src/components/hud/HudPanels.tsx:815
    React 13



The above error occurred in the <HudSystemsPanel> component.

React will try to recreate this component tree from scratch using the error boundary you provided, PagesDevOverlayErrorBoundary.
 Stack:
    HudDrawer webpack-internal:///(pages-dir-browser)/./src/components/HudDrawer.tsx:1213
    SimPage webpack-internal:///(pages-dir-browser)/./src/pages/sim.tsx:1027
    MyApp webpack-internal:///(pages-dir-browser)/./src/pages/_app.tsx:29
```

- [ ] Radar does not show terrain.
- [ ] I'm able to toggle between spectator mode and player mode even in realistic rulesets.
- [ ] I don't see a way to leave a vessel, and get back to "join space" modal.
- [ ] Joining a vessel from hud drawer tab in spectator mode does not put me in player mode even if it assigns me on the vessel.
