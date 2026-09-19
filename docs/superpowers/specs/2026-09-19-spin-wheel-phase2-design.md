# Spin-the-Wheel Phase 2 (Visual + Spin Mechanic) Design

## Overview

Phase 1a built the wheel's geometry only: plain-colored SVG wedges, a static center hub with a plain triangle pointer, and a temporary +/− control to change segment count (2–12), with no animation and no real rewards.

Phase 2 replaces that with the real product surface, matching the Figma mockup shared in conversation (a "SPIN KARO, GOLD JEETO!" screen: ornate maroon/gold mandala background, a bordered wheel with 6 icon segments, a header row with a coin-balance chip and a spin-counter badge, and a SPIN button) pixel-for-pixel using the exported Figma assets below, and adds the actual spin mechanic: press SPIN, the wheel spins and lands on one of 6 fixed rewards, coin balance and spins-remaining update, a result card shows what was won.

## Goals

- Visually match the mockup: mandala background, ornate bordered wheel, hub flower+swan+pointer, per-segment reward icons, title graphics, coin-balance chip, spin-counter badge, SPIN button, "X/3 Spins" text.
- A working spin: tap SPIN → weighted-random reward chosen → wheel animates to land on it → reward applied to local state → result shown.
- Ambient background motion: the mandala background rotates continuously and slowly, semi-transparent, independent of the spin.

## Non-goals (explicitly deferred)

- **Persistence.** Coin balance and spins-remaining are local component/hook state (`useState`/hook-owned), not backed by AsyncStorage or a global store. Resets on app reload. Migrating to zustand + AsyncStorage persist middleware is a follow-up, not part of this phase.
- **Daily spin-limit reset logic.** Once spins-remaining hits 0, SPIN just stays disabled — no timer, no "come back tomorrow", no date tracking.
- **Avatar / real user profile.** The mockup's avatar circle is a Figma comment marker, not a real element — not built.
- **Backend / real economy.** No server, no real currency, no multi-device sync.
- **Segment-count control.** Phase 1a's temporary +/− (2–12 segments) is removed entirely. The wheel always shows the fixed 6-reward layout below.

## Asset inventory & rename mapping

All source files are in `~/Downloads` (Figma exports, added today). Copy into `assets/images/wheel/` (matches the repo's existing `assets/images/` convention) under these clearer names:

| Source file (Downloads) | Destination | Used for |
|---|---|---|
| `Vector.png` | `assets/images/wheel/wheel-background-mandala.png` | Full-screen ambient rotating background |
| `Frame 1618875132.png` | `assets/images/wheel/wheel-border-ring.png` | Static ornate border around the wedges (in Hub) |
| `Frame 1618875066.png` | `assets/images/wheel/wheel-hub-flower.png` | Static center hub decoration (behind swan) |
| `Vector (1).png` | `assets/images/wheel/wheel-hub-swan.png` | Static center hub icon (on top of flower) |
| `Vector.svg` | `assets/images/wheel/wheel-pointer.svg` | Static pointer flag at top of wheel |
| `GOLD JEETO!.png` | `assets/images/wheel/title-gold-jeeto.png` | Title graphic, line 2 |
| `SPIN KARO.png` | `assets/images/wheel/title-spin-karo.png` | Title graphic, line 1 |
| `hf_20260723_072632_8065fd34-d32c-4502-a158-3e30d3b348db 3.png` | `assets/images/wheel/reward-icon-gold.png` | "Free Gold" segment icon |
| `image 2692.png` | `assets/images/wheel/reward-icon-extra-spin.png` | "Extra Spin" segment icon |
| `hf_20260812_094609_f040949c-cab0-4305-8a4e-1e8be686a337 1.png` | `assets/images/wheel/reward-icon-grand-prize.png` | "Grand Prize" segment icon |
| `image 2717.png` | `assets/images/wheel/reward-icon-no-win.png` | "No-Win" segment icon |
| `Gold coin.svg` | `assets/images/wheel/icon-coin.svg` | Coin-balance chip icon |
| `Frame 1618875146.svg` | `assets/images/wheel/icon-spin-counter.svg` | Spin-counter badge icon |

**Excluded — purpose unclear from the export, not incorporated:** `Ellipse 2266.svg` (generic gradient circle, no clear mockup match), `Frame 1618875145.png` (small diamond/gem, no clear mockup match). Low risk if wrong — easy to add later if actually needed; flag if you know what these are for.

**Standalone SVG/PNG assets** (`wheel-pointer.svg`, `icon-coin.svg`, `icon-spin-counter.svg`, and all PNGs used outside the wheel's own SVG canvas — background, hub flower/swan, titles) render via `expo-image`'s `<Image source={require(...)} />`. Confirmed: `expo-image` 57.0.5 lists SVG as a supported source format (its README's format-support table marks SVG ✅ for iOS/Android/Web) — no separate `.svg`-transformer config needed.

**The 4 in-wedge reward icons are the one exception**: they render *inside* `WheelSegments`' `<Svg>` canvas, alongside the `<Path>` wedges — a plain React Native `Image` (expo-image included) cannot be a child of `<Svg>`. These use `react-native-svg`'s own `<Image>` element instead (an SVG-namespace image primitive, `href`/`xlinkHref` to the PNG, positioned with `x`/`y`/`width`/`height` like any other SVG child).

## New dependency

`expo-linear-gradient` is not currently installed and is needed for both the root background gradient and the SPIN button's gradient fill. Add via `npx expo install expo-linear-gradient`.

## Architecture

Builds on Phase 1a's existing layer split — `WheelSegments` was already isolated as "the only thing that will rotate later" (its own Phase 1a doc comment), so the spin animation slots into the existing composition rather than requiring a rewrite.

**Build order** (de-risks the two hardest parts independently): (1) the reward picker and target-angle math, as plain functions with no UI; (2) wire the animation onto the *existing Phase 1a plain-colored wheel* to prove the spin mechanic end-to-end (rotation math, cumulative angle, completion handling) without any asset risk; (3) swap in the real visual assets (background, border, hub, icons, titles, button gradient) last, once the mechanic is already proven correct underneath.

**Files:**

- `src/utils/wheelMath.ts` — unchanged (still pure geometry: `segmentAngle`, `polarToCartesian`, `describeArc`, `segmentBounds`).
- `src/constants/wheelRewards.ts` **(new)** — the 6 reward configs, in mockup order (clockwise from top):

  ```ts
  export type RewardKind = 'gold' | 'extraSpin' | 'grandPrize' | 'noWin';

  export type WheelReward = {
    id: string;
    kind: RewardKind;
    label: string;
    icon: ImageSourcePropType; // require(...) of the matching reward-icon-*.png
    colors: [string, string]; // 2-stop gradient fill for this wedge, mockup-matched
    coinValue: number; // 0 for noWin, +1 "spin" represented separately for extraSpin
    weight: number; // relative weight, does not need to sum to 100
  };

  export const WHEEL_REWARDS: WheelReward[]; // length 6, index = segment index
  ```

  Proposed default values (coin/weight are adjustable, not load-bearing for the mechanic; `colors` are mockup-matched and drive the wedge fill):

  | index | kind | label | colors | coinValue | weight |
  |---|---|---|---|---|---|
  | 0 (top) | extraSpin | Extra Spin | `['#4A6CF7', '#1E3A8A']` (blue) | 0 (+1 spin instead) | 10 |
  | 1 | gold | Free Gold | `['#FFCF87', '#C9971F']` (gold) | 10 | 25 |
  | 2 | noWin | Try Again | `['#97004C', '#55052D']` (dark maroon) | 0 | 20 |
  | 3 | gold | Free Gold | `['#FFCF87', '#C9971F']` (gold) | 10 | 20 |
  | 4 | grandPrize | Grand Prize | `['#6A4C93', '#3C0185']` (purple) | 100 | 5 |
  | 5 | gold | Free Gold | `['#FFCF87', '#C9971F']` (gold) | 10 | 20 |

- `src/components/wheel/WheelSegments.tsx` **(modified)**:
  - **Wedge radius no longer fills the full canvas.** Phase 1a's wedges used `r = size / 2` — their own outer arc was the wheel's only visible "rim". Now that the real `wheel-border-ring.png` overlay exists (in `Hub`), the wedges must stop at that ring's *inner* edge instead, or they'd render underneath/behind the border artwork at the wrong radius. Measured directly from the asset (not guessed): `wheel-border-ring.png` is **1080×1131px — not square** (alpha-channel-scanned: 888px-diameter transparent inner circle, centered, confirmed circular on both axes). `Hub` renders it at `size × size` with `contentFit="contain"` (see Hub bullet below), which — because the asset is taller than wide — scales to fit the *height* (the constraining dimension: `size/1131 < size/1080`), letterboxing the width slightly. Under that scaling the inner circle displays at `size * (888/1131) ≈ 0.785 * size`. `WHEEL_INNER_RADIUS_RATIO = 0.83` is set deliberately a bit *larger* than that 0.785 figure, so the wedges' outer edge tucks slightly under the ring's inner edge rather than stopping exactly at it — avoiding a visible anti-aliasing seam between wedge and ring at their boundary. Wedge radius becomes `r = (size / 2) * WHEEL_INNER_RADIUS_RATIO`, with `cx`/`cy` unchanged (still `size / 2`, the canvas center — only `r` shrinks, so the wedges stay centered).
  - **Fill switches from `WheelSegment.color` to a 2-stop gradient** from the wedge's `WheelReward.colors`. Each distinct `colors` pair gets one `<LinearGradient>` def (`gradientUnits="objectBoundingBox"`, dedup by color pair so the 3 "Free Gold" wedges share one def, not three), referenced by each `<Path fill="url(#...)">`.
  - **Each wedge shows label + icon together**, both inside the same rotated `<G>` (rotates with the wedge, `transform="rotate(${mid} ...)"` — unchanged from Phase 1a's technique). Within the wedge's own (pre-rotation) radial line, the icon sits at the larger radius (nearer the rim) and the label at the smaller radius (nearer the hub) — matching the mockup. The `noWin` wedge is the one exception: icon only, no label text (matches the mockup — the confused-face icon has no caption).
  - Icon rendering uses `react-native-svg`'s `<Image>` (see Asset inventory section — cannot use a plain/expo `Image` inside `<Svg>`).
  - This is still the only component the spin rotates.
- `src/components/wheel/Hub.tsx` **(modified)** — replaces the Phase 1a placeholder shapes with the real static assets (via `expo-image`), all non-rotating: `wheel-border-ring.png` rendered at `size × size` with `contentFit="contain"` (the asset is 1080×1131, not square — `contain` fits it without distorting the ring into an ellipse; see the wedge-radius math above for how this affects the inner-circle sizing), `wheel-pointer.svg` positioned per the Figma frame coordinates (pending — see open question), `wheel-hub-flower.png` + `wheel-hub-swan.png` centered (replaces the plain circle).
- `src/components/wheel/Wheel.tsx` **(modified)** — same composition shape as Phase 1a: wraps `WheelSegments` in a reanimated `Animated.View` whose `transform: rotate` is driven by a shared value passed in as a prop; `Hub` renders after it, unrotated. New prop: `rotation: SharedValue<number>` (degrees). The rotating `Animated.View` gets `renderToHardwareTextureAndroid` and `shouldRasterizeIOS` — the wedge layer now has gradients + multiple SVG images per wedge, and rasterizing it into a single GPU-cached layer keeps the spin animation smooth instead of re-painting the whole SVG tree every frame.
- `src/hooks/useWheelSpin.ts` **(new)** — signature:

  ```ts
  function useWheelSpin(options: {
    rewards: WheelReward[];
    canSpin: boolean; // e.g. spinsRemaining > 0, owned by the screen
    onSpinStart: () => void; // screen decrements spinsRemaining here
    onResult: (reward: WheelReward) => void; // screen applies coinValue/extraSpin here
  }): {
    rotation: SharedValue<number>;
    state: 'idle' | 'spinning' | 'result';
    currentReward: WheelReward | null; // for SpinResultCard to display, nothing more
    spin: () => void;
    dismissResult: () => void;
  }
  ```

  Owns:
  - a reanimated shared value for the wedge-layer rotation (cumulative across spins — never resets to 0, always adds forward)
  - `isSpinningRef` (`useRef(false)`, not state) as the double-tap guard — checked and set synchronously at the very top of `spin()`, before any state update, so two rapid taps can't both pass the check while waiting for a re-render. `state` (`'idle'|'spinning'|'result'`) drives the UI; the ref is what actually prevents re-entry.
  - `spin()`: no-ops if `isSpinningRef.current` is true, or `state !== 'idle'` (covers `'result'` too — SPIN must stay disabled while a result is still showing, not just while actually spinning), or `canSpin` is false. The ref is the fast synchronous check for the double-tap race; the `state` check is the correctness backstop in case `spin()` is ever called while a result card is up. Otherwise sets the ref, calls `onSpinStart()` (spins-remaining decrements immediately, not after landing), picks a weighted-random reward index from `rewards`, computes the target rotation (see Data flow below), and calls `withTiming(target, { duration, easing: Easing.out(Easing.cubic) }, (finished) => { 'worklet'; if (finished) { scheduleOnRN(handleSpinComplete, rewardIndex); } })`. The completion callback runs on the UI thread (reanimated worklet) — `finished` must be checked (it's `false` if the animation was interrupted), and `scheduleOnRN` (from `react-native-worklets`, **not** the deprecated `runOnJS`) is what hops back to the JS thread to actually update React state.
  - `handleSpinComplete(rewardIndex)` (JS thread, invoked via `scheduleOnRN`): resets `isSpinningRef.current = false`, sets `state` to `'result'` with the picked reward, calls `onResult(rewards[rewardIndex])` — this is where the reward is actually applied to the caller's coin/spin-count state, once, here, and nowhere else.
  - `dismissResult()`: transitions `state` back to `'idle'`.
- `src/app/index.tsx` **(rewritten)**:
  - Background is two layers. **Bottom: a solid root gradient** — `expo-linear-gradient`, `colors={['#4F031B', '#2A010E']}`, top → bottom, `StyleSheet.absoluteFill`, behind everything else, replacing Phase 1a's flat `backgroundColor`. **On top of that: the rotating mandala** — `wheel-background-mandala.png` via `expo-image`, opacity ~0.2, wrapped in its own `Animated.View`. Sized to the screen's diagonal (`Math.sqrt(width² + height²)` from `useWindowDimensions`), centered, so a rotating corner never exposes empty space at the screen's edges; the parent container is sized to the actual screen bounds with `overflow: 'hidden'` to clip the oversized rotating image back down to the visible rect. Driven by a separate, independent reanimated shared value via `withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1)` (continuous ambient spin, starts on mount, never stops) — **unless** `useReducedMotion()` (from `react-native-reanimated`) is `true`, in which case the rotation is skipped entirely and the background renders static (accessibility: respects the OS-level reduce-motion setting).
  - **Wheel size:** `Math.min(width * 0.9, height * 0.45)` — replaces Phase 1a's `Math.min(width * 0.9, 420)`. This screen is now a much taller composite (header row, two-line title, wheel, SPIN button, "X/3 Spins" text) than Phase 1a's minimal layout, so the constraint switches from a fixed pixel cap to a height-proportional one to avoid overflow on short screens.
  - Header row: coin-balance chip (`icon-coin.svg` via `expo-image` + `{coins}` text) and spin-counter badge (`icon-spin-counter.svg` via `expo-image` + `{spinsRemaining}/3` text). Both values are local `useState` in this screen.
  - Title: `title-spin-karo.png` above `title-gold-jeeto.png` (both `expo-image`).
  - `Wheel` (passing `useWheelSpin`'s rotation shared value).
  - SPIN button: `expo-linear-gradient` fill, disabled whenever `useWheelSpin`'s `state !== 'idle'` (covers both `'spinning'` and `'result'` — no re-spin while a result is still on screen) or `spinsRemaining <= 0`. The screen passes `canSpin={spinsRemaining > 0}`, `onSpinStart={() => setSpinsRemaining(n => n - 1)}`, `onResult={(reward) => applyReward(reward)}` into `useWheelSpin`. `applyReward` (and `onSpinStart`'s decrement) use **functional state updates only** — `setCoins(c => c + reward.coinValue)`, `setSpinsRemaining(n => n + 1)` for `extraSpin` — never `setCoins(coins + reward.coinValue)` reading the closed-over value directly, since `onResult` is a callback invoked later (after the animation), by which point a directly-read `coins`/`spinsRemaining` closed over at render time could be stale.
  - "X/3 Spins" text below the button.
  - `SpinResultCard` rendered when state is `'result'`.
- `src/components/wheel/SpinResultCard.tsx` **(new)** — purely presentational: `{ reward: WheelReward; onDismiss: () => void }`. Renders the reward's icon + label. Owns only its own auto-dismiss timer and an early-dismiss tap handler, both calling `onDismiss`. It does **not** touch coin/spin-count state — that was already applied by `useWheelSpin`'s `onResult` callback before this card ever rendered, so the card can't apply a reward twice or apply one that never lands.

  The auto-dismiss timer's `useEffect` has an **empty dependency array** — it must run exactly once per mount (the card only ever mounts once per result, but a `setTimeout` re-armed on every render, e.g. if the effect depended on `onDismiss`, would either double-fire or reset the countdown each time the parent re-renders for an unrelated reason). Since the effect can't depend on `onDismiss` but must still call the *latest* one (not a stale closure from mount), this repo's installed React is 19.2.3, which has `useEffectEvent` as a stable (non-experimental) export — exactly built for this: a function that always sees the latest props/state without being a reactive dependency itself.
  ```tsx
  const onDismissEvent = useEffectEvent(() => { onDismiss(); });
  useEffect(() => {
    const t = setTimeout(() => onDismissEvent(), 2000);
    return () => clearTimeout(t);
  }, []);
  ```
  (No manual ref juggling needed — a hand-rolled `useRef` + render-time assignment would be the fallback only on a React version without `useEffectEvent`, which isn't the case here.)

## Data flow — one spin

1. User taps SPIN. Screen calls `useWheelSpin().spin()`.
2. Hook guards: no-op if `isSpinningRef.current` is true, or `state !== 'idle'` (covers `'result'`, not just `'spinning'`), or `canSpin` is false. The ref check is synchronous (closes the double-tap race across the async gap before React re-renders the disabled button); the `state` check is the backstop for re-spinning while a result is still showing.
3. Hook sets `isSpinningRef.current = true`, calls `onSpinStart()` (screen decrements `spinsRemaining` immediately, not after landing), then picks a reward index via cumulative-weight random selection over `WHEEL_REWARDS`.
4. Hook computes the target angle. Let `mid = segmentBounds(rewardIndex, 6).mid` and `current` be the shared value's current rotation:
   ```
   const FULL_TURNS = 5;
   const mod360 = (deg: number) => ((deg % 360) + 360) % 360;
   const delta = mod360(-mid - current);
   const target = current + 360 * FULL_TURNS + delta;
   ```
   `delta` is normalized into `[0, 360)` first, so `target` is always `current` plus a clean 5+ full forward turns — never a smaller or negative rotation, regardless of what `current` already is (this matters because `current` keeps growing across spins, it's never reset to 0).
5. Hook animates the shared value from `current` to `target` with `withTiming` (ease-out, ~2.5s), state → `'spinning'`. The completion callback is a worklet: `(finished) => { 'worklet'; if (finished) { scheduleOnRN(handleSpinComplete, rewardIndex); } }` — `scheduleOnRN` (from `react-native-worklets`) hops back to the JS thread; `runOnJS` is deprecated in the installed version and must not be used.
6. `handleSpinComplete(rewardIndex)` runs on JS: `isSpinningRef.current = false`, `state` → `'result'` with the picked reward, calls `onResult(rewards[rewardIndex])` — this is the one place the reward is actually applied to the screen's coin/spin-count state.
7. Screen sees `'result'`, renders `SpinResultCard` (display-only — reward was already applied in step 6).
8. Card auto-dismisses (or taps) → `onDismiss` → hook's `dismissResult()` → state → `'idle'`.

## Error handling / edge cases

- **Double-tap SPIN during animation:** guarded by `isSpinningRef` (a ref, checked+set synchronously) as the fast path — `state` updates are batched/async and a second tap could otherwise land inside the window before a re-render disables the button.
- **Re-spin while the result card is still showing:** `isSpinningRef` alone wouldn't catch this — it's already reset to `false` by the time `state` becomes `'result'`. The hook's `spin()` also checks `state !== 'idle'` directly (see Architecture) as the correctness backstop, and the SPIN button's own `disabled` prop covers it at the UI level too.
- **Interrupted animation:** the `withTiming` completion worklet checks `finished` before calling `scheduleOnRN` — if the animation was cancelled/interrupted (`finished === false`), `handleSpinComplete` never runs, so a reward is never applied for a spin that didn't actually finish.
- **Spins-remaining reaches 0:** SPIN button `disabled` (`canSpin` false), no further mechanic — explicitly deferred (see Non-goals). Decremented at spin *start*, not on landing, so a spin already in flight can't be double-counted against the limit.
- **Rotation never resets to 0:** always cumulative (`target = current + 360*FULL_TURNS + delta`), so the wheel only ever spins forward — avoids a visible "snap back" between spins, and the `mod360` normalization on `delta` guarantees a full-forward rotation regardless of how large `current` has grown.
- **Ambient background rotation vs. spin rotation:** two independent reanimated shared values on two independent layers (background `Animated.View` vs. wedge `Animated.View` inside `Wheel`) — no shared state, no interaction, no conflict.
- **Reduced motion:** `useReducedMotion()` gates the ambient background loop only (the spin animation itself always runs — it's the result of a direct user action, not ambient motion, so it isn't gated the same way).
- **Icons tilt with their wedges:** matches the mockup — no counter-rotation, same `rotate(${mid} ...)` transform Phase 1a already uses for labels.

## Testing / verification

Same constraint as Phase 1a: no test framework in this repo (no jest). Verification:
- `npx tsc --noEmit` after each task — the only automated check; no throwaway verification script this phase (Phase 1a's was for genuinely non-obvious trig; this phase's math is verified directly on-device instead, per the Build order above).
- On-device (iOS Simulator + Android emulator, both already available and used in Phase 1a): multiple consecutive spins (confirming cumulative rotation never snaps back), the wheel visually lands on the picked reward each time, background rotates continuously and stays semi-transparent and clipped to the screen (no gap at corners), border ring stays fixed while wedges spin, icons tilt with their wedges, coin/spin counters update correctly and exactly once per spin, SPIN disables at 0 spins remaining, and — with the OS reduce-motion setting on — the background renders static while a manual SPIN still animates normally.

## Self-review

- **Placeholder scan:** no TBDs; reward values are explicitly marked as adjustable defaults, not placeholders for missing information.
- **Internal consistency:** border ring is static (Hub) per the confirmed correction; background mandala rotates ambiently and independently per the confirmed correction; these don't contradict — they're two different assets (`wheel-border-ring.png` vs `wheel-background-mandala.png`).
- **Scope:** focused on one screen's visual + mechanic; persistence/economy/backend explicitly out, consistent with the "UI integration first" instruction.
- **Ambiguity resolved:** icon rotation direction (tilts with wedge, matching the mockup), label/icon radial ordering within a wedge, cumulative rotation formula, reward-application ownership (hook's `onResult`, exactly once, via functional state updates, never the display-only result card), the UI-thread→JS-thread hop (`scheduleOnRN`, verified against the installed `react-native-worklets` version rather than assumed), SPIN's disabled condition (covers `'result'`, not just `'spinning'`), the wedge radius vs. the border ring's inner edge (measured from the actual asset's alpha channel, not guessed), and result-card dismiss timing (effect-runs-once + latest-callback-via-ref) are all specified concretely rather than left open.
