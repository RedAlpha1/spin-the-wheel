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
