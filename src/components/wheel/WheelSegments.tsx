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
