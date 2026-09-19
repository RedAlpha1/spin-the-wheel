// src/components/wheel/Hub.tsx
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  size: number;
};

// The maroon/gold backdrop disc the flower+swan sit on (matches the
// downloaded mockup asset).
const HUB_BACKDROP_RATIO = 0.19;
// Reference mockup: the flower fills almost the whole backdrop disc as a
// radiating petal pattern, with the swan smaller and centered on top of it
// — not the same size as the flower, which is what made the flower
// invisible before.
const HUB_FLOWER_TO_BACKDROP_RATIO = 0.88;
const HUB_SWAN_TO_BACKDROP_RATIO = 0.52;

function HubBase({ size }: Props) {
  const hubBackdropSize = size * HUB_BACKDROP_RATIO;
  const hubBackdropOffset = (size - hubBackdropSize) / 2;
  const hubFlowerSize = hubBackdropSize * HUB_FLOWER_TO_BACKDROP_RATIO;
  const hubFlowerOffset = (size - hubFlowerSize) / 2;
  const hubSwanSize = hubBackdropSize * HUB_SWAN_TO_BACKDROP_RATIO;
  const hubSwanOffset = (size - hubSwanSize) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../../assets/images/wheel/wheel-border-ring.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      <Image
        source={require('../../../assets/images/wheel/wheel-hub-backdrop.png')}
        style={{
          position: 'absolute',
          left: hubBackdropOffset,
          top: hubBackdropOffset,
          width: hubBackdropSize,
          height: hubBackdropSize,
        }}
        contentFit="contain"
      />
      <Image
        source={require('../../../assets/images/wheel/wheel-hub-flower.png')}
        style={{
          position: 'absolute',
          left: hubFlowerOffset,
          top: hubFlowerOffset,
          width: hubFlowerSize,
          height: hubFlowerSize,
        }}
        contentFit="contain"
      />
      <Image
        source={require('../../../assets/images/wheel/wheel-hub-swan.png')}
        style={{
          position: 'absolute',
          left: hubSwanOffset,
          top: hubSwanOffset,
          width: hubSwanSize,
          height: hubSwanSize,
        }}
        contentFit="contain"
      />
    </View>
  );
}

export const Hub = memo(HubBase);
