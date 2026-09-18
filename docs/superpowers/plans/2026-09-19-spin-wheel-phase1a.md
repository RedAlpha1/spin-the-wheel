# Spin-the-Wheel Phase 1a (Geometry Only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a wheel-of-fortune wheel (2–12 segments, sized to the window) with correct pie-slice geometry, radial labels, and a static center hub + pointer — no styling polish, no animation, no gestures.

**Architecture:** Pure geometry helpers (`wheelMath.ts`) feed two `react-native-svg` layers stacked in a plain `View`: a memoized `WheelSegments` layer (paths + labels, the only thing that will rotate in Phase 2) and a static `Hub` overlay (center circle + pointer, `pointerEvents="none"` so it never blocks future touch/gesture handling). The Home tab screen (`src/app/index.tsx`) owns window-based sizing and temporary +/− controls for segment count.

**Tech Stack:** Expo SDK ~57 (New Architecture / bridgeless by default), expo-router, TypeScript (strict), react-native-svg 15.15.4, react-native-safe-area-context ~5.7.0, React 19.2.3, Node v22.21.1 (used only for a throwaway verification script, see Global Constraints).

**Spec:** Provided inline by the user in this conversation (no separate spec file exists). The full requirements are captured in Global Constraints and in each task's Files/Interfaces section below.

## Global Constraints

- **Project root is the inner folder.** The repo has a wrapper directory (`/Users/prakharpandey/react-native-practice`) containing only `package.json` (zustand) and `package-lock.json`, and inside it the actual Expo project: `/Users/prakharpandey/react-native-practice/react-native-practice` (has `app.json`, `src/`, the real `package.json` with `expo`, `expo-router`, etc.). **Run every command in this plan from `/Users/prakharpandey/react-native-practice/react-native-practice`.**
- **`@/*` alias already exists.** `tsconfig.json` already has `"@/*": ["./src/*"]` and `"@/assets/*": ["./assets/*"]`. Do not re-add it.
- **Dependencies already installed** — do not run `npx expo install` for these, they're already at these versions in `package.json`/`node_modules`: `react-native-svg@15.15.4`, `react-native-safe-area-context@~5.7.0`. If a step ever reports either missing, run `npx expo install react-native-svg react-native-safe-area-context` (from the project root above) before continuing.
- **No test framework is configured** (no jest, no `@testing-library/*`). Node is v22.21.1, which supports `node --experimental-strip-types` to run a plain `.ts` file with no build step and no new dependency. Task 1 uses this to write a throwaway, `node:assert/strict`-based verification script for the pure math functions — closest available substitute for a unit test in this repo. It is deleted before the commit; it never ships.
- **No animation, gestures, or state libraries.** Use plain `useState`/`useMemo`/`memo`. Do not add `zustand` usage, `react-native-reanimated`, or `react-native-gesture-handler` even though they're present in `package.json` for later phases.
- **Segment shape for this phase:** `{ id: string; label: string; color: string }` — defined once in `WheelSegments.tsx` and imported everywhere else that needs it.
- **Angle convention (must be consistent across every function):** `0°` = 12 o'clock (straight up), angles increase **clockwise**. Segment `i` of `count` is centered at `i * (360 / count)`, so segment `0` is always centered at `0°` (straight up, under the static pointer) at rest.
- **Existing template screens: no deletions.** `src/app/index.tsx` currently renders the Expo starter "Welcome" screen (hero + hint rows) inside a `NativeTabs` Home/Explore layout (`src/app/_layout.tsx` → `src/components/app-tabs.tsx`). This plan **overwrites the contents of `src/app/index.tsx` only** — it does not touch `_layout.tsx`, `app-tabs.tsx`, or `explore.tsx`, and it does not delete any file. Two components become unused as a result (left in place, not deleted): `src/components/hint-row.tsx` (only ever imported by the old `index.tsx`) and the `AnimatedIcon` export from `src/components/animated-icon.tsx` (the sibling `AnimatedSplashOverlay` export from the same file is still used by `_layout.tsx` and must not be touched). The wheel screen still renders under the native Home/Explore tab bar — it is not full-screen without navigation. If you want either of those things to change (delete the orphaned files, or go full-screen without tabs), say so before Task 5.
- **Testing device requirement:** rendering checks at 2/3/6/12 segments and the iOS/Android comparison in Task 5 require Expo Go (or a simulator/emulator) on both platforms. If only one platform is available, do that one and note which platform was skipped.

---

## Task 1: Wheel geometry math (`wheelMath.ts`)

**Files:**
- Modify: `src/utils/wheelMath.ts` (file exists but is currently empty)
- Test (throwaway, not committed): `src/utils/wheelMath.check.ts`

**Interfaces:**
- Produces (consumed by Task 2):
  - `segmentAngle(count: number): number`
  - `polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number }`
  - `describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string` (SVG path `d` string)
  - `segmentBounds(index: number, count: number): { start: number; end: number; mid: number }`

- [ ] **Step 1: Write the implementation**

```typescript
// src/utils/wheelMath.ts

/** Degrees per segment when the wheel is split into `count` equal slices. */
export function segmentAngle(count: number): number {
  return 360 / count;
}

/**
 * Converts a polar angle to an SVG point. 0deg = 12 o'clock, angles increase
 * clockwise (matches how a physical spin wheel is read).
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  };
}

/**
 * Builds an SVG pie-slice path (center -> arc edge -> arc edge -> back to
 * center) covering the clockwise angular span [startDeg, endDeg].
 */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;

  return [
    'M', cx, cy,
    'L', end.x, end.y,
    'A', r, r, 0, largeArcFlag, 0, start.x, start.y,
    'Z',
  ].join(' ');
}

/** Segment `index` of `count` is centered at index * segmentAngle(count). */
export function segmentBounds(
  index: number,
  count: number,
): { start: number; end: number; mid: number } {
  const angle = segmentAngle(count);
  const mid = index * angle;
  return {
    start: mid - angle / 2,
    end: mid + angle / 2,
    mid,
  };
}
```

- [ ] **Step 2: Write the throwaway verification script**

```typescript
// src/utils/wheelMath.check.ts
// Scratch verification only — delete after it passes (Step 4). Not part of
// the app. Exists because this repo has no test runner (see Global
// Constraints); run directly with `node --experimental-strip-types`.

import assert from 'node:assert/strict';

import { describeArc, polarToCartesian, segmentAngle, segmentBounds } from './wheelMath';

function approx(actual: number, expected: number, label: string) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: expected ${expected}, got ${actual}`);
}

// segmentAngle
assert.equal(segmentAngle(4), 90);
assert.equal(segmentAngle(3), 120);
assert.equal(segmentAngle(12), 30);

// polarToCartesian: 0=top, 90=right, 180=bottom, 270=left (clockwise)
const top = polarToCartesian(100, 100, 50, 0);
approx(top.x, 100, 'top.x');
approx(top.y, 50, 'top.y');

const right = polarToCartesian(100, 100, 50, 90);
approx(right.x, 150, 'right.x');
approx(right.y, 100, 'right.y');

const bottom = polarToCartesian(100, 100, 50, 180);
approx(bottom.x, 100, 'bottom.x');
approx(bottom.y, 150, 'bottom.y');

const left = polarToCartesian(100, 100, 50, 270);
approx(left.x, 50, 'left.x');
approx(left.y, 100, 'left.y');

// segmentBounds: segment 0 of 4 is centered at 0deg (top), spans -45..45
const seg0of4 = segmentBounds(0, 4);
approx(seg0of4.start, -45, 'seg0of4.start');
approx(seg0of4.end, 45, 'seg0of4.end');
approx(seg0of4.mid, 0, 'seg0of4.mid');

// segment 1 of 4 is centered at 90deg, spans 45..135
const seg1of4 = segmentBounds(1, 4);
approx(seg1of4.start, 45, 'seg1of4.start');
approx(seg1of4.end, 135, 'seg1of4.end');
approx(seg1of4.mid, 90, 'seg1of4.mid');

// 2 segments: each spans exactly 180deg (the largeArc boundary case)
const seg0of2 = segmentBounds(0, 2);
approx(seg0of2.start, -90, 'seg0of2.start');
approx(seg0of2.end, 90, 'seg0of2.end');

// describeArc: 90deg span (4 segments) — largeArcFlag must be 0
const pathSmall = describeArc(100, 100, 50, -45, 45);
const tokens = pathSmall.split(' ');
assert.equal(tokens[0], 'M');
approx(Number(tokens[1]), 100, 'M.x');
approx(Number(tokens[2]), 100, 'M.y');
assert.equal(tokens[3], 'L');
const end45 = polarToCartesian(100, 100, 50, 45);
approx(Number(tokens[4]), end45.x, 'L.x (end point)');
approx(Number(tokens[5]), end45.y, 'L.y (end point)');
assert.equal(tokens[6], 'A');
assert.equal(tokens[10], '0', 'largeArcFlag for 90deg span must be 0');
assert.equal(tokens[11], '0', 'sweepFlag must be 0 (arc travels end -> start)');
const start45 = polarToCartesian(100, 100, 50, -45);
approx(Number(tokens[12]), start45.x, 'arc target x (start point)');
approx(Number(tokens[13]), start45.y, 'arc target y (start point)');
assert.equal(tokens[14], 'Z');

// describeArc: exactly 180deg span (2 segments) — boundary case, must stay
// largeArcFlag=0 since ">" (not ">=") is the comparison
const pathHalf = describeArc(100, 100, 50, -90, 90);
const halfTokens = pathHalf.split(' ');
assert.equal(halfTokens[10], '0', 'largeArcFlag at exactly 180deg must be 0 (boundary, not > 180)');

console.log('wheelMath checks passed');
```

- [ ] **Step 3: Run the check and confirm it fails first, then passes**

Run: `node --experimental-strip-types src/utils/wheelMath.check.ts`

Before Step 1's implementation exists (or if you temporarily comment it out), this fails with a module resolution or assertion error. With the Step 1 implementation in place, run it again.

Expected: prints `wheelMath checks passed` and exits 0. If any `assert` throws, the message names exactly which value was wrong (e.g. `largeArcFlag for 90deg span must be 0: expected 0, got 1`) — fix `wheelMath.ts`, not the check script.

- [ ] **Step 4: Type-check, then delete the throwaway script**

Run: `npx tsc --noEmit`
Expected: no errors.

Then delete the scratch file — it must not be committed:

```bash
rm src/utils/wheelMath.check.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/wheelMath.ts
git commit -m "feat: add wheel geometry math (segment angles, polar coords, pie-slice paths)"
```

---

## Task 2: Segment layer (`WheelSegments.tsx`)

**Files:**
- Create: `src/components/wheel/WheelSegments.tsx`

**Interfaces:**
- Consumes (from Task 1): `describeArc(cx, cy, r, startDeg, endDeg): string`, `polarToCartesian(cx, cy, r, angleDeg): {x,y}`, `segmentBounds(index, count): {start, end, mid}`
- Produces (consumed by Task 4):
  - `export type WheelSegment = { id: string; label: string; color: string }`
  - `export const WheelSegments: React.MemoExoticComponent<(props: { segments: WheelSegment[]; size: number }) => JSX.Element>`

- [ ] **Step 1: Create the directory and component**

```bash
mkdir -p src/components/wheel
```

```tsx
// src/components/wheel/WheelSegments.tsx
import { memo, useMemo } from 'react';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { describeArc, polarToCartesian, segmentBounds } from '@/utils/wheelMath';

export type WheelSegment = {
  id: string;
  label: string;
  color: string;
};

type Props = {
  segments: WheelSegment[];
  size: number;
};

function WheelSegmentsBase({ segments, size }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const labelRadius = r * 0.65;
  const fontSize = size * 0.06;

  const slices = useMemo(
    () =>
      segments.map((segment, index) => {
        const { start, end, mid } = segmentBounds(index, segments.length);
        const path = describeArc(cx, cy, r, start, end);
        const labelPos = polarToCartesian(cx, cy, labelRadius, mid);
        return { segment, path, labelPos, mid };
      }),
    [segments, cx, cy, r, labelRadius],
  );

  return (
    <Svg width={size} height={size}>
      {slices.map(({ segment, path, labelPos, mid }) => (
        <G key={segment.id}>
          <Path d={path} fill={segment.color} />
          <SvgText
            x={labelPos.x}
            y={labelPos.y}
            fontSize={fontSize}
            fill="#ffffff"
            textAnchor="middle"
            transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}>
            {segment.label}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

export const WheelSegments = memo(WheelSegmentsBase);
```

Notes for the implementer:
- `transform` (a plain SVG transform string) is used instead of the deprecated `rotation`/`origin` props on `<Text>` — check `node_modules/react-native-svg/lib/typescript/lib/extract/types.d.ts` if you want to see why (`rotation` is explicitly marked `@deprecated Use rotate in transform prop instead`).
- `useMemo` recomputes only when `segments` or `size` change — not on every render of a parent.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (There's no consumer yet, so this only checks the file compiles in isolation — Task 4 wires it up for a visual check.)

- [ ] **Step 3: Commit**

```bash
git add src/components/wheel/WheelSegments.tsx
git commit -m "feat: add WheelSegments SVG layer (pie slices + radial labels)"
```

---

## Task 3: Static hub overlay (`Hub.tsx`)

**Files:**
- Create: `src/components/wheel/Hub.tsx`

**Interfaces:**
- Produces (consumed by Task 4): `export const Hub: React.MemoExoticComponent<(props: { size: number }) => JSX.Element>`

- [ ] **Step 1: Create the component**

```tsx
// src/components/wheel/Hub.tsx
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

type Props = {
  size: number;
};

function HubBase({ size }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const hubRadius = size * 0.06;
  const pointerWidth = size * 0.08;
  const pointerHeight = size * 0.08;

  // Apex at y=0 (the top edge of the wheel's bounding box), base below it —
  // a triangle that points up, sitting right at the top edge.
  const pointerPoints = [
    `${cx},0`,
    `${cx - pointerWidth / 2},${pointerHeight}`,
    `${cx + pointerWidth / 2},${pointerHeight}`,
  ].join(' ');

  return (
    <Svg
      width={size}
      height={size}
      style={StyleSheet.absoluteFill}
      pointerEvents="none">
      <Polygon points={pointerPoints} fill="#333333" />
      <Circle cx={cx} cy={cy} r={hubRadius} fill="#333333" />
    </Svg>
  );
}

export const Hub = memo(HubBase);
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/wheel/Hub.tsx
git commit -m "feat: add static Hub overlay (center circle + top pointer)"
```

---

## Task 4: Compose the wheel (`Wheel.tsx`)

**Files:**
- Create: `src/components/wheel/Wheel.tsx`

**Interfaces:**
- Consumes: `WheelSegments` + `WheelSegment` (Task 2), `Hub` (Task 3)
- Produces (consumed by Task 5): `export function Wheel(props: { segments: WheelSegment[]; size: number }): JSX.Element`

- [ ] **Step 1: Create the component**

```tsx
// src/components/wheel/Wheel.tsx
import { View } from 'react-native';

import { Hub } from './Hub';
import { WheelSegments, type WheelSegment } from './WheelSegments';

type Props = {
  segments: WheelSegment[];
  size: number;
};

export function Wheel({ segments, size }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <WheelSegments segments={segments} size={size} />
      <Hub size={size} />
    </View>
  );
}
```

`Hub`'s `StyleSheet.absoluteFill` needs a positioned ancestor: React Native's default `position` for `View` is already `relative`, so no extra style is needed on this wrapper.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/wheel/Wheel.tsx
git commit -m "feat: compose WheelSegments and Hub into a single Wheel component"
```

---

## Task 5: Wire up the Home screen and verify on-device

**Files:**
- Modify: `src/app/index.tsx` (full rewrite — see Global Constraints for what this displaces and why nothing is deleted)

**Interfaces:**
- Consumes: `Wheel` + `WheelSegment` (Task 4/2)

- [ ] **Step 1: Replace the screen contents**

```tsx
// src/app/index.tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wheel } from '@/components/wheel/Wheel';
import type { WheelSegment } from '@/components/wheel/WheelSegments';

const SEGMENT_COLORS = [
  '#E63946', '#F1A208', '#2A9D8F', '#264653',
  '#8D5B4C', '#457B9D', '#6A4C93', '#F4A261',
  '#1D3557', '#B5838D', '#606C38', '#9B5DE5',
];

const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 12;

function buildSegments(count: number): WheelSegment[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `segment-${index}`,
    label: `${index + 1}`,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
  }));
}

export default function HomeScreen() {
  const [count, setCount] = useState(6);
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.9, 420);
  const segments = buildSegments(count);

  return (
    <SafeAreaView style={styles.container}>
      <Wheel segments={segments} size={size} />
      <View style={styles.controls}>
        <Pressable
          style={styles.button}
          disabled={count <= MIN_SEGMENTS}
          onPress={() => setCount((current) => Math.max(MIN_SEGMENTS, current - 1))}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.countText}>{count} segments</Text>
        <Pressable
          style={styles.button}
          disabled={count >= MAX_SEGMENTS}
          onPress={() => setCount((current) => Math.min(MAX_SEGMENTS, current + 1))}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A0E0E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7A1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 24,
  },
  countText: {
    color: '#ffffff',
    fontSize: 16,
    minWidth: 96,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Start the dev server and open on both platforms**

Run: `npx expo start`

Open the project in Expo Go (or a simulator/emulator) for iOS and for Android — scan the QR code or press `i` / `a` in the terminal.

- [ ] **Step 4: Verify geometry at each segment count, on both platforms**

Using the `−`/`+` buttons, check at **2, 3, 6, and 12** segments, on **both iOS and Android**, that:
- Segments tile the full circle with no gaps or overlapping wedges.
- Segment `1` (index 0) is always centered directly under the top pointer.
- At 12 segments, every label is still legible (not clipped, not overlapping its neighbors).
- The center hub circle and pointer stay static (don't resize/shift) as the count changes.

If a wedge looks inverted or ballooned at 3/6/12 but fine at 2, re-check the `largeArcFlag` line in `describeArc` — 2 segments is exactly the case that can't reveal that class of bug (see the explanation this plan ends with).

- [ ] **Step 5: Commit**

```bash
git add src/app/index.tsx
git commit -m "feat: wire wheel into Home screen with window-based sizing and segment-count controls"
```

- [ ] **Step 6: Deliver the requested explanation**

Once Task 5 is verified, answer these for the user (content below, ready to hand over — no further investigation needed):

1. **Why `describeArc` draws `end → start` with `sweep=0`, and what breaks at 2 segments if `largeArcFlag` is wrong:**
   `polarToCartesian` treats `0°` as top and increasing angle as clockwise on screen. Per the SVG arc spec, `sweep=1` means "positive-angle direction," which renders clockwise in a y-down coordinate system — so walking `start → end` (increasing angle) the short way is a `sweep=1` arc. Walking it the other direction, `end → start`, along that exact same arc is `sweep=0` — its mirror. Building the path as `M center, L end, A(sweep=0) start, Z` also means the two straight radii of the slice (`center→end` and `center→start`) come for free from one explicit `L` and the auto-closing `Z`, instead of writing `L center` twice.
   The `largeArcFlag` bug is invisible at exactly 2 segments and only there: each slice spans exactly `180°`, the one angle where the "large" and "small" arc between two points are the *same size* (both halves). So `largeArcFlag` has zero visual effect at 2 segments — a wrong formula (e.g. always `0`, or `>=` instead of `>` at the boundary) renders correctly by coincidence. At 3/6/12 segments (spans `<180°`), the same bug draws the reflex/complementary wedge instead of the pie slice — visibly wrong (e.g. 3 huge overlapping ~240° balloons instead of 3 thirds). That's why Task 5's Done check tests 2, 3, 6, *and* 12 — testing only 2 would never catch this.

2. **What `memo` on `WheelSegments` prevents once the wheel animates (Phase 2):**
   Once rotation animation exists, something will update every frame (~60fps) while the wheel spins. Without `memo`, if any ancestor re-renders on each animation tick, `WheelSegments` would re-run its whole render — including, without the `useMemo` inside it, recomputing every arc path and label position — even though its own `segments`/`size` props never changed. `memo` makes it bail out and skip re-rendering whenever those props are referentially unchanged; the rotation gets applied as a transform on an ancestor/wrapper around this static SVG content, not by re-rendering the segments themselves. Android analogy: like wrapping a Composable in `remember`/skipping recomposition — the spin becomes a `rotation` transform applied to a cached layer, not a re-measure/re-draw of the whole layout every frame.

3. **Why `Hub` needs `pointerEvents="none"`:**
   `Hub` is a decorative overlay stacked on top of `WheelSegments` via `StyleSheet.absoluteFill`. Without `pointerEvents="none"`, it would capture touches over its *entire* bounding box (the full wheel-sized SVG canvas), not just the pixels it actually draws (the small circle and pointer) — so it would block/steal any future tap or drag gesture meant for the wheel underneath (e.g. a "press to spin" gesture in Phase 2). `pointerEvents="none"` makes it fully transparent to touch/gesture hit-testing. Android analogue: a transparent `View` sized to match its parent will still intercept `ACTION_DOWN` unless you mark it `clickable="false"`/pass touches through — same idea, applied to the whole overlay rather than per-pixel.

Then list, from Step 4's on-device checks, anything that behaved differently between iOS and Android (expected candidates to watch for, confirm/replace with what was actually observed):
- SVG `<Text>` font metrics/kerning are rendered by the native text stack on each platform (Core Text on iOS vs. Android's layout engine) — identical `fontSize` can look slightly larger/smaller or vertically offset between the two; worth a close look at label centering at 12 segments specifically.
- `NativeTabs` (`expo-router/unstable-native-tabs`) renders a real `UITabBarController` on iOS vs. the native Android bottom-nav equivalent — bar height differs, which changes how much vertical room is left for the wheel above/below it on the Home tab.
- Safe-area insets differ (iOS home indicator vs. Android system bars/back-gesture area); `SafeAreaView` compensates automatically, but on a short Android device it's worth confirming the wheel + controls aren't cramped against the tab bar, since sizing here is width-based (`min(90% width, 420)`) and doesn't currently account for available height.

---

## Self-Review Notes

- **Spec coverage:** every bullet in the user's request maps to a task — `wheelMath.ts` (Task 1), `WheelSegments.tsx` memo+useMemo (Task 2), `Hub.tsx` absoluteFill+pointerEvents+circle+pointer (Task 3), `Wheel.tsx` composition (Task 4), `index.tsx` sizing/buttons/SafeAreaView/dark-maroon (Task 5), the three explanation questions + platform differences (Task 5 Step 6). The `@/*` alias and `npx expo install` items are addressed in Global Constraints since both are already satisfied — no task needed.
- **Conflict disclosure:** handled in Global Constraints (orphaned `hint-row.tsx` and `AnimatedIcon` export, tab bar still present) instead of silently deleting anything, per the user's explicit instruction.
- **Placeholder scan:** no TBDs; every step has runnable code or an exact command.
- **Type consistency:** `WheelSegment` is defined once (Task 2) and imported by type everywhere else (Task 4, Task 5); `segmentBounds` return shape (`{start, end, mid}`) matches its one call site in Task 2; `Wheel`'s prop names (`segments`, `size`) match what Task 5 passes.
