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
