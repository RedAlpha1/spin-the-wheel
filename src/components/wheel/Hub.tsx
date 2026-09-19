// src/components/wheel/Hub.tsx
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  size: number;
};

// On-device check showed 0.32 swallowing the wedge labels — shrunk so the
// flower+swan stay a small center emblem clear of the label radius.
const HUB_DECORATION_RATIO = 0.2;
// The maroon/gold backdrop disc the flower+swan sit on (matches the
// downloaded mockup asset). 0.3 crept into the label radius (see
// WheelSegments) — 0.26 keeps clearance.
const HUB_BACKDROP_RATIO = 0.26;

function HubBase({ size }: Props) {
  const hubDecorationSize = size * HUB_DECORATION_RATIO;
  const hubDecorationOffset = (size - hubDecorationSize) / 2;
  const hubBackdropSize = size * HUB_BACKDROP_RATIO;
  const hubBackdropOffset = (size - hubBackdropSize) / 2;

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
          left: hubDecorationOffset,
          top: hubDecorationOffset,
          width: hubDecorationSize,
          height: hubDecorationSize,
        }}
        contentFit="contain"
      />
      <Image
        source={require('../../../assets/images/wheel/wheel-hub-swan.png')}
        style={{
          position: 'absolute',
          left: hubDecorationOffset,
          top: hubDecorationOffset,
          width: hubDecorationSize,
          height: hubDecorationSize,
        }}
        contentFit="contain"
      />
    </View>
  );
}

export const Hub = memo(HubBase);
