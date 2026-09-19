// src/components/wheel/Hub.tsx
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  size: number;
};

// Pointer proportions are visually estimated, not measured from Figma — see
// docs/superpowers/specs/2026-09-19-spin-wheel-phase2-design.md. Flag for
// on-device tuning.
const POINTER_ASPECT = 28 / 37;
const POINTER_WIDTH_RATIO = 0.14;
// On-device check (see spec) showed the 0.38 estimate colliding with wedge
// labels/icons and the hub decoration — moved up near the rim instead,
// where a wheel pointer conventionally sits.
const POINTER_Y_CENTER_RATIO = 0.12;
// On-device check showed 0.32 swallowing the wedge labels — shrunk so the
// flower+swan stay a small center emblem clear of the label radius.
const HUB_DECORATION_RATIO = 0.2;

function HubBase({ size }: Props) {
  const pointerWidth = size * POINTER_WIDTH_RATIO;
  const pointerHeight = pointerWidth * POINTER_ASPECT;
  const hubDecorationSize = size * HUB_DECORATION_RATIO;
  const hubDecorationOffset = (size - hubDecorationSize) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../../assets/images/wheel/wheel-border-ring.png')}
        style={{ width: size, height: size }}
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
      <Image
        source={require('../../../assets/images/wheel/wheel-pointer.svg')}
        style={{
          position: 'absolute',
          left: size / 2 - pointerWidth / 2,
          top: size * POINTER_Y_CENTER_RATIO - pointerHeight / 2,
          width: pointerWidth,
          height: pointerHeight,
        }}
        contentFit="contain"
      />
    </View>
  );
}

export const Hub = memo(HubBase);
