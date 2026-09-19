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

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const wheelSize = Math.min(width * 0.9, height * 0.45);
  const backgroundSize = Math.sqrt(width * width + height * height);

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
              style={styles.chipIcon}
              contentFit="contain"
            />
            <Text style={styles.chipText}>{coins}</Text>
          </View>
          <View style={styles.chip}>
            <Image
              source={require('../../assets/images/wheel/icon-spin-counter.svg')}
              style={styles.chipIcon}
              contentFit="contain"
            />
            <Text style={styles.chipText}>{spinsRemaining}/{STARTING_SPINS}</Text>
          </View>
        </View>

        <View style={styles.titles}>
          <Image
            source={require('../../assets/images/wheel/title-spin-karo.png')}
            style={styles.titleTop}
            contentFit="contain"
          />
          <Image
            source={require('../../assets/images/wheel/title-gold-jeeto.png')}
            style={styles.titleBottom}
            contentFit="contain"
          />
        </View>

        <Wheel segments={WHEEL_REWARDS} size={wheelSize} rotation={rotation} />

        <Pressable
          style={styles.spinButtonWrapper}
          disabled={state !== 'idle' || spinsRemaining <= 0}
          onPress={spin}>
          <LinearGradient
            colors={['#FFCF87', '#C9971F']}
            style={[styles.spinButton, (state !== 'idle' || spinsRemaining <= 0) && styles.spinButtonDisabled]}>
            <Text style={styles.spinButtonText}>SPIN</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.spinsText}>
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
  chipIcon: {
    width: 20,
    height: 20,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  titles: {
    alignItems: 'center',
  },
  titleTop: {
    width: 220,
    height: 40,
  },
  titleBottom: {
    width: 220,
    height: 40,
  },
  spinButtonWrapper: {
    borderRadius: 28,
  },
  spinButton: {
    paddingVertical: 14,
    paddingHorizontal: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonText: {
    color: '#4F031B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinsText: {
    color: '#ffffff',
    fontSize: 14,
  },
});
