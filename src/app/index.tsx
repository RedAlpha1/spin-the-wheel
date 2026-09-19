import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wheel } from '@/components/wheel/Wheel';
import { SpinResultCard } from '@/components/wheel/SpinResultCard';
import { WHEEL_REWARDS, type WheelReward } from '@/constants/wheelRewards';
import { Spacing } from '@/constants/theme';
import { useWheelSpin } from '@/hooks/useWheelSpin';

const STARTING_COINS = 0;
const STARTING_SPINS = 3;
const BACKGROUND_SPIN_DURATION_MS = 20000;

// Chrome around the wheel (titles, chips, SPIN button, result card) was
// fixed-point — same absolute size on a small phone and a large tablet.
// Android's device spread is wide (~320dp small phones to 600dp+ tablets/
// foldables), so these scale off screen width like the wheel itself does.
// Ratios are each element's old fixed value divided by a 390pt baseline
// (a common mid-size phone width) so on-device sizing is unchanged there.
const TITLE_WIDTH_RATIO = 0.62;
const CHIP_ICON_RATIO = 20 / 390;
const CHIP_FONT_RATIO = 14 / 390;
const SPIN_BUTTON_PADDING_V_RATIO = 14 / 390;
const SPIN_BUTTON_FONT_RATIO = 18 / 390;
const SPINS_TEXT_FONT_RATIO = 14 / 390;
// The ornamental flourishes flanking the button (user-provided assets) are
// 141x141 native — sized relative to screen width like everything else,
// overlapping the pill's rounded ends slightly so they read as attached
// rather than floating beside it.
const FLOURISH_WIDTH_RATIO = 0.16;
const FLOURISH_ASPECT = 137 / 141;
const FLOURISH_OVERLAP_RATIO = 0.35;
// Native pixel aspect ratios of the two title images — sizing height off
// the image's own aspect instead of a shared box avoids letterboxing.
const TITLE_TOP_ASPECT = 77 / 497;
const TITLE_BOTTOM_ASPECT = 133 / 957;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const wheelSize = Math.min(width * 0.9, height * 0.45);
  const backgroundSize = Math.sqrt(width * width + height * height);
  const titleWidth = width * TITLE_WIDTH_RATIO;
  const chipIconSize = width * CHIP_ICON_RATIO;
  const chipFontSize = width * CHIP_FONT_RATIO;
  const spinButtonFontSize = width * SPIN_BUTTON_FONT_RATIO;
  const spinsTextFontSize = width * SPINS_TEXT_FONT_RATIO;
  const flourishWidth = width * FLOURISH_WIDTH_RATIO;
  const flourishHeight = flourishWidth * FLOURISH_ASPECT;
  const flourishOverlap = flourishWidth * FLOURISH_OVERLAP_RATIO;

  const [coins, setCoins] = useState(STARTING_COINS);
  const [spinsRemaining, setSpinsRemaining] = useState(STARTING_SPINS);

  const reducedMotion = useReducedMotion();
  const backgroundRotation = useSharedValue(0);
  useEffect(() => {
    if (!reducedMotion) {
      backgroundRotation.value = withRepeat(
        withTiming(360, { duration: BACKGROUND_SPIN_DURATION_MS, easing: Easing.linear }),
        -1,
      );
    }
  }, [reducedMotion, backgroundRotation]);
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${backgroundRotation.value}deg` }],
  }));

  const applyReward = useCallback((reward: WheelReward) => {
    setCoins((c) => c + reward.coinValue);
    if (reward.kind === 'extraSpin') {
      setSpinsRemaining((n) => n + 1);
    }
  }, []);

  const { rotation, state, currentReward, spin, dismissResult } = useWheelSpin({
    rewards: WHEEL_REWARDS,
    canSpin: spinsRemaining > 0,
    onSpinStart: () => setSpinsRemaining((n) => n - 1),
    onResult: applyReward,
  });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#4F031B', '#2A010E']} style={StyleSheet.absoluteFill} />
      <View style={[styles.backgroundClip, { width, height }]}>
        <Animated.View
          style={[
            backgroundAnimatedStyle,
            {
              width: backgroundSize,
              height: backgroundSize,
              left: (width - backgroundSize) / 2,
              top: (height - backgroundSize) / 2,
            },
          ]}>
          <Image
            source={require('../../assets/images/wheel/wheel-background-mandala.png')}
            style={{ width: backgroundSize, height: backgroundSize, opacity: 0.2 }}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.chip}>
            <Image
              source={require('../../assets/images/wheel/icon-coin.svg')}
              style={{ width: chipIconSize, height: chipIconSize }}
              contentFit="contain"
            />
            <Text style={[styles.chipText, { fontSize: chipFontSize }]}>{coins}</Text>
          </View>
          <View style={styles.chip}>
            <Image
              source={require('../../assets/images/wheel/icon-spin-counter.svg')}
              style={{ width: chipIconSize, height: chipIconSize }}
              contentFit="contain"
            />
            <Text style={[styles.chipText, { fontSize: chipFontSize }]}>
              {spinsRemaining}/{STARTING_SPINS}
            </Text>
          </View>
        </View>

        <View style={styles.titles}>
          <Image
            source={require('../../assets/images/wheel/title-spin-karo.png')}
            style={{ width: titleWidth, height: titleWidth * TITLE_TOP_ASPECT }}
            contentFit="contain"
          />
          <Image
            source={require('../../assets/images/wheel/title-gold-jeeto.png')}
            style={{ width: titleWidth, height: titleWidth * TITLE_BOTTOM_ASPECT }}
            contentFit="contain"
          />
        </View>

        <Wheel segments={WHEEL_REWARDS} size={wheelSize} rotation={rotation} />

        <View style={styles.spinButtonRow}>
          <Image
            source={require('../../assets/images/wheel/spin-button-flourish-left.png')}
            style={{ width: flourishWidth, height: flourishHeight, marginRight: -flourishOverlap }}
            contentFit="contain"
          />
          <Pressable
            style={[styles.spinButtonWrapper, styles.spinButtonWrapperFlex]}
            disabled={state !== 'idle' || spinsRemaining <= 0}
            onPress={spin}>
            <LinearGradient
              colors={['#FFF2D4', '#FFCF87']}
              style={[
                styles.spinButton,
                {
                  paddingVertical: width * SPIN_BUTTON_PADDING_V_RATIO,
                },
                (state !== 'idle' || spinsRemaining <= 0) && styles.spinButtonDisabled,
              ]}>
              <Text style={[styles.spinButtonText, { fontSize: spinButtonFontSize }]}>SPIN</Text>
            </LinearGradient>
          </Pressable>
          <Image
            source={require('../../assets/images/wheel/spin-button-flourish-right.png')}
            style={{ width: flourishWidth, height: flourishHeight, marginLeft: -flourishOverlap }}
            contentFit="contain"
          />
        </View>

        <Text style={[styles.spinsText, { fontSize: spinsTextFontSize }]}>
          {spinsRemaining}/{STARTING_SPINS} Spins
        </Text>
      </SafeAreaView>

      {state === 'result' && currentReward && (
        <SpinResultCard reward={currentReward} onDismiss={dismissResult} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#4A0E0E',
  },
  backgroundClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  chipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  titles: {
    alignItems: 'center',
  },
  spinButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  spinButtonWrapper: {
    borderRadius: 28,
    zIndex: 1,
  },
  spinButtonWrapperFlex: {
    flex: 1,
  },
  spinButton: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonText: {
    color: '#1B0B33',
    fontWeight: 'bold',
  },
  spinsText: {
    color: '#ffffff',
  },
});
