import { memo, useMemo } from 'react';
import Svg, {
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';

import type { WheelReward } from '@/constants/wheelRewards';
import { describeArc, polarToCartesian, segmentBounds } from '@/utils/wheelMath';

export type WheelSegment = WheelReward;

// Wedges stop short of `wheel-border-ring.png`'s inner edge (see
// docs/superpowers/specs/2026-09-19-spin-wheel-phase2-design.md). The ring
// asset has a transparent buffer between its petals and the measured hole
// edge, so on-device feedback (icon/label text felt cramped) pushed this
// overshoot well past the original 1.01 anti-aliasing margin — wedges now
// fill that buffer too, leaving a visibly thinner border and more room for
// each wedge's icon + label.
const WHEEL_INNER_RADIUS_RATIO = (888 / 1131) * 1.14;

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
  // Icon pushed further toward the rim, label pulled further toward the
  // hub, and both shrunk slightly — the previous 0.72/0.48 split let the
  // label's outer edge run into the icon's inner edge (most visible on the
  // top wedge, where both sit on the same vertical line).
  const iconSize = size * 0.115;
  const iconRadius = r * 0.78;
  const labelRadius = r * 0.44;
  // Single-line labels (e.g. "Extra Spin") were wider than the wedge's
  // chord at labelRadius and spilled into the neighboring segment — each
  // label wraps onto its own words as stacked lines instead.
  const fontSize = size * 0.033;
  const lineHeight = fontSize * 1.15;

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
          {segment.kind !== 'noWin' && (() => {
            const words = segment.label.split(' ');
            const startDy = -(lineHeight * (words.length - 1)) / 2;
            return (
              <SvgText
                x={labelPos.x}
                y={labelPos.y}
                fontSize={fontSize}
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
                transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}>
                {words.map((word, wordIndex) => (
                  <TSpan
                    key={word}
                    x={labelPos.x}
                    dy={wordIndex === 0 ? startDy : lineHeight}>
                    {word}
                  </TSpan>
                ))}
              </SvgText>
            );
          })()}
        </G>
      ))}
    </Svg>
  );
}

export const WheelSegments = memo(WheelSegmentsBase);
