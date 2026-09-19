import { memo, useMemo } from 'react';
import Svg, { Defs, G, Image as SvgImage, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import type { WheelReward } from '@/constants/wheelRewards';
import { describeArc, polarToCartesian, segmentBounds } from '@/utils/wheelMath';

export type WheelSegment = WheelReward;

// Wedges stop short of `wheel-border-ring.png`'s inner edge (see
// docs/superpowers/specs/2026-09-19-spin-wheel-phase2-design.md) — the
// `x1.01` overshoot tucks the wedge edge slightly under the ring so no
// anti-aliasing seam shows.
const WHEEL_INNER_RADIUS_RATIO = (888 / 1131) * 1.01;

type Props = {
  segments: WheelSegment[];
  size: number;
};

function gradientId(colors: [string, string]): string {
  return `wedge-gradient-${colors[0].replace('#', '')}-${colors[1].replace('#', '')}`;
}

function WheelSegmentsBase({ segments, size }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * WHEEL_INNER_RADIUS_RATIO;
  const iconSize = size * 0.13;
  const iconRadius = r * 0.72;
  const labelRadius = r * 0.4;
  const fontSize = size * 0.045;

  const slices = useMemo(
    () =>
      segments.map((segment, index) => {
        const { start, end, mid } = segmentBounds(index, segments.length);
        const path = describeArc(cx, cy, r, start, end);
        const iconPos = polarToCartesian(cx, cy, iconRadius, mid);
        const labelPos = polarToCartesian(cx, cy, labelRadius, mid);
        return { segment, path, iconPos, labelPos, mid };
      }),
    [segments, cx, cy, r, iconRadius, labelRadius],
  );

  const gradients = useMemo(() => {
    const seen = new Map<string, [string, string]>();
    for (const segment of segments) {
      seen.set(gradientId(segment.colors), segment.colors);
    }
    return Array.from(seen.entries());
  }, [segments]);

  return (
    <Svg width={size} height={size}>
      <Defs>
        {gradients.map(([id, [from, to]]) => (
          <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        ))}
      </Defs>
      {slices.map(({ segment, path, iconPos, labelPos, mid }) => (
        <G key={segment.id}>
          <Path d={path} fill={`url(#${gradientId(segment.colors)})`} />
          <G transform={`rotate(${mid} ${iconPos.x} ${iconPos.y})`}>
            <SvgImage
              href={segment.icon}
              x={iconPos.x - iconSize / 2}
              y={iconPos.y - iconSize / 2}
              width={iconSize}
              height={iconSize}
            />
          </G>
          {segment.kind !== 'noWin' && (
            <SvgText
              x={labelPos.x}
              y={labelPos.y}
              fontSize={fontSize}
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
              transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}>
              {segment.label}
            </SvgText>
          )}
        </G>
      ))}
    </Svg>
  );
}

export const WheelSegments = memo(WheelSegmentsBase);
