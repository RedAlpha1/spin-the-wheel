// src/components/wheel/Hub.tsx
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  size: number;
};

// The maroon/gold center medallion (flower + swan + needle, pre-composited
// per user-provided asset) sized as a fraction of the wheel.
const HUB_MEDALLION_RATIO = 0.24;
// wheel-hub-medallion.png is 354x410: a 354x354 circle with a needle baked
// onto its own top edge occupying the remaining 56px. The needle attaches
// to the medallion's own gold ring, not the wheel's outer rim — sizing and
// positioning off these measured proportions keeps that attachment intact
// at any wheel size.
const MEDALLION_CIRCLE_PX = 354;
const MEDALLION_TOTAL_HEIGHT_PX = 410;
const MEDALLION_ASPECT = MEDALLION_TOTAL_HEIGHT_PX / MEDALLION_CIRCLE_PX;

function HubBase({ size }: Props) {
  const medallionWidth = size * HUB_MEDALLION_RATIO;
  const medallionHeight = medallionWidth * MEDALLION_ASPECT;
  const medallionLeft = (size - medallionWidth) / 2;
  // The circle's center sits at (total - circle/2) from the image top —
  // aligning that point to the wheel's own center is what keeps the
  // needle's attachment point consistent regardless of wheel size.
  const circleCenterFromTop = medallionHeight - medallionWidth / 2;
  const medallionTop = size / 2 - circleCenterFromTop;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../../assets/images/wheel/wheel-border-ring.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      <Image
        source={require('../../../assets/images/wheel/wheel-hub-medallion.png')}
        style={{
          position: 'absolute',
          left: medallionLeft,
          top: medallionTop,
          width: medallionWidth,
          height: medallionHeight,
        }}
        contentFit="contain"
      />
    </View>
  );
}

export const Hub = memo(HubBase);
