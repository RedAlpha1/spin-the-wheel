import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Hub } from './Hub';
import { WheelSegments, type WheelSegment } from './WheelSegments';

type Props = {
  segments: WheelSegment[];
  size: number;
  rotation: SharedValue<number>;
};

export function Wheel({ segments, size, rotation }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={animatedStyle} renderToHardwareTextureAndroid shouldRasterizeIOS>
        <WheelSegments segments={segments} size={size} />
      </Animated.View>
      <Hub size={size} />
    </View>
  );
}
