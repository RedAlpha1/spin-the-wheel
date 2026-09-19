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

SVG assets (`wheel-pointer.svg`, `icon-coin.svg`, `icon-spin-counter.svg`) render via `react-native-svg`'s `SvgXml`/`SvgUri` or as static `.svg` imports (already have `react-native-svg` transformer support in Expo by default) — confirm at plan time which import path this Expo SDK version supports; PNG assets render via `Image`/`expo-image` `source={require(...)}`.

## New dependency

`expo-linear-gradient` is not currently installed and is needed for the SPIN button's gradient fill. Add via `npx expo install expo-linear-gradient`.

## Architecture

Builds on Phase 1a's existing layer split — `WheelSegments` was already isolated as "the only thing that will rotate later" (its own Phase 1a doc comment), so the spin animation slots into the existing composition rather than requiring a rewrite.

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
    coinValue: number; // 0 for noWin, +1 "spin" represented separately for extraSpin
    weight: number; // relative weight, does not need to sum to 100
  };

  export const WHEEL_REWARDS: WheelReward[]; // length 6, index = segment index
  ```

  Proposed default values (adjust freely, they're not load-bearing for the mechanic):

  | index | kind | label | coinValue | weight |
  |---|---|---|---|---|
  | 0 (top) | extraSpin | Extra Spin | 0 (+1 spin instead) | 10 |
  | 1 | gold | Free Gold | 10 | 25 |
  | 2 | noWin | Try Again | 0 | 20 |
  | 3 | gold | Free Gold | 10 | 20 |
  | 4 | grandPrize | Grand Prize | 100 | 5 |
  | 5 | gold | Free Gold | 10 | 20 |

- `src/components/wheel/WheelSegments.tsx` **(modified)** — wedges keep their `describeArc` path, but fill switches from a flat `WheelSegment.color` to each reward's gradient/fill from the mockup, and the label switches from plain text to the reward's icon rendered upright (not rotated with the wedge — `transform` on the icon's own wrapper counter-rotates by `-mid` so it stays visually upright regardless of wedge angle). This is still the only component the spin rotates.
- `src/components/wheel/Hub.tsx` **(modified)** — replaces the Phase 1a placeholder shapes with the real static assets, all non-rotating: `wheel-border-ring.png` (full-size overlay, same as Phase 1a's `Hub` sizing), `wheel-pointer.svg` at the top (replaces the plain triangle), `wheel-hub-flower.png` + `wheel-hub-swan.png` centered (replaces the plain circle).
- `src/components/wheel/Wheel.tsx` **(modified)** — same composition shape as Phase 1a: wraps `WheelSegments` in a reanimated `Animated.View` whose `transform: rotate` is driven by a shared value passed in as a prop; `Hub` renders after it, unrotated. New prop: `rotation: SharedValue<number>` (degrees).
- `src/hooks/useWheelSpin.ts` **(new)** — owns:
  - a reanimated shared value for the wedge-layer rotation (cumulative across spins — never resets to 0, always adds forward)
  - state: `'idle' | 'spinning' | 'result'`
  - `spin()`: picks a weighted-random reward from `WHEEL_REWARDS`, computes the target rotation (current rotation + N full turns + the offset needed to bring that reward's segment under the fixed top pointer), animates via `withTiming` (ease-out, ~2.5s), and on completion transitions to `'result'` with the picked reward
  - `dismissResult()`: transitions back to `'idle'`
- `src/app/index.tsx` **(rewritten)**:
  - Background: `wheel-background-mandala.png` absolutely positioned behind everything, opacity ~0.2, wrapped in its own `Animated.View` with a separate, independent reanimated shared value driven by `withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1)` (continuous ambient spin, starts on mount, never stops).
  - Header row: coin-balance chip (`icon-coin.svg` + `{coins}` text) and spin-counter badge (`icon-spin-counter.svg` + `{spinsRemaining}/3` text). Both values are local `useState` in this screen.
  - Title: `title-spin-karo.png` above `title-gold-jeeto.png`.
  - `Wheel` (passing `useWheelSpin`'s rotation shared value).
  - SPIN button: `expo-linear-gradient` fill, disabled while `useWheelSpin`'s state is `'spinning'` or `spinsRemaining <= 0`.
  - "X/3 Spins" text below the button.
  - `SpinResultCard` rendered when state is `'result'`.
- `src/components/wheel/SpinResultCard.tsx` **(new)** — small overlay card: reward icon + label. Auto-dismisses after ~2s (`setTimeout` + cleanup) and dismisses early on tap. Calls `dismissResult()` and, on mount, applies the reward to the screen's coin/spin-count state (via a callback prop — the card doesn't own that state, the screen does).

## Data flow — one spin

1. User taps SPIN. Screen calls `useWheelSpin().spin()`.
2. Hook guards: no-op if already `'spinning'` or if the screen tells it `spinsRemaining <= 0` (screen passes this in, hook doesn't own it).
3. Hook picks a reward index via cumulative-weight random selection over `WHEEL_REWARDS`.
4. Hook computes target angle: `currentRotation + 360 * turnsFor(minSpinDuration) - segmentBounds(index, 6).mid` (negative because the pointer is fixed at angle 0 and the wedge layer rotates to bring the target segment's mid-angle to 0).
5. Hook animates the shared value from `currentRotation` to the target with `withTiming`, state → `'spinning'`.
6. On animation completion (reanimated callback), hook sets state → `'result'` with the picked reward, stores the new `currentRotation` for the next spin's starting point.
7. Screen sees `'result'`, renders `SpinResultCard`, applies `coinValue`/extra-spin to its local state.
8. Card auto-dismisses (or taps) → `dismissResult()` → state → `'idle'`.

## Error handling / edge cases

- **Double-tap SPIN during animation:** guarded at the hook level (no-op unless `'idle'`).
- **Spins-remaining reaches 0:** SPIN button `disabled`, no further mechanic — explicitly deferred (see Non-goals).
- **Rotation never resets to 0:** always cumulative, so the wheel only ever spins forward — avoids a visible "snap back" between spins.
- **Ambient background rotation vs. spin rotation:** two independent reanimated shared values on two independent layers (background `Animated.View` vs. wedge `Animated.View` inside `Wheel`) — no shared state, no interaction, no conflict.
- **Icons staying upright in rotated wedges:** each icon's own transform counters the wedge's rotation (`-mid`), same technique already used for label positioning in Phase 1a, just applied to keep icons upright instead of rotating them.

## Testing / verification

Same constraint as Phase 1a: no test framework in this repo (no jest). Verification:
- `npx tsc --noEmit` after each task.
- A throwaway `node --experimental-strip-types` script (same pattern as Phase 1a Task 1) verifying the pure logic in isolation: weighted-random pick distribution over many trials roughly matches configured weights, and target-angle math lands each reward's segment mid-angle under the pointer (0°) for a representative sample of current-rotation starting points.
- On-device (iOS Simulator + Android emulator, both already available and used in Phase 1a): multiple spins, confirm the wheel visually lands on the picked reward each time, background rotates continuously and stays semi-transparent, border ring stays fixed while wedges spin, icons render upright, coin/spin counters update correctly, SPIN disables at 0 spins remaining.

## Self-review

- **Placeholder scan:** no TBDs; reward values are explicitly marked as adjustable defaults, not placeholders for missing information.
- **Internal consistency:** border ring is static (Hub) per the confirmed correction; background mandala rotates ambiently and independently per the confirmed correction; these don't contradict — they're two different assets (`wheel-border-ring.png` vs `wheel-background-mandala.png`).
- **Scope:** focused on one screen's visual + mechanic; persistence/economy/backend explicitly out, consistent with the "UI integration first" instruction.
- **Ambiguity resolved:** icon-upright-in-wedge technique, cumulative rotation, result-card dismiss timing are all specified concretely rather than left open.
