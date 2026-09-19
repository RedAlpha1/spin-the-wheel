import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { segmentBounds } from '@/utils/wheelMath';

/**
 * Picks an index into `weights` with probability proportional to each
 * weight. Weights don't need to sum to any particular total.
 */
export function pickWeightedIndex(weights: number[], random: () => number = Math.random): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = random() * total;
  for (let i = 0; i < weights.length; i++) {
    remaining -= weights[i];
    if (remaining < 0) {
      return i;
    }
  }
  return weights.length - 1;
}

// UX research on prize-wheel spins: ~3-4s duration with 5-10 full turns and
// a cubic ease-out balances visual drama against feeling sluggish. 2500ms/5
// turns read as too fast/abrupt — bumped to 4000ms/7 turns.
const FULL_TURNS = 7;

function mod360(deg: number): number {
  'worklet';
  return ((deg % 360) + 360) % 360;
}

/**
 * Target rotation for the wedge layer to land `mid` (a segment's mid-angle)
 * under the fixed pointer at angle 0, spinning forward from `current`.
 * `current` keeps growing across spins (never reset to 0), so `delta` is
 * normalized into [0, 360) first — the result is always `current` plus a
 * clean `fullTurns`-or-more forward rotation, never smaller or negative.
 */
export function computeTargetRotation(current: number, mid: number, fullTurns: number = FULL_TURNS): number {
  const delta = mod360(-mid - current);
  return current + 360 * fullTurns + delta;
}

const SPIN_DURATION_MS = 4000;

export type SpinState = 'idle' | 'spinning' | 'result';

type WeightedItem = { weight: number };

type UseWheelSpinOptions<T extends WeightedItem> = {
  rewards: T[];
  canSpin: boolean;
  onSpinStart: () => void;
  onResult: (reward: T) => void;
};

/**
 * Owns the wedge-layer rotation and the idle/spinning/result state machine
 * for one spin. See docs/superpowers/specs/2026-09-19-spin-wheel-phase2-design.md
 * for the full data-flow writeup this implements.
 */
export function useWheelSpin<T extends WeightedItem>({
  rewards,
  canSpin,
  onSpinStart,
  onResult,
}: UseWheelSpinOptions<T>) {
  const rotation = useSharedValue(0);
  const isSpinningRef = useRef(false);
  const [state, setState] = useState<SpinState>('idle');
  const [currentReward, setCurrentReward] = useState<T | null>(null);

  // Most prize-wheel apps pair the spin with a tick per segment crossed
  // (the classic mechanical-peg feel) plus a win notification on landing —
  // both haptic and audible, since either channel alone is easy to miss.
  const tickPlayer = useAudioPlayer(require('../../assets/sounds/spin-tick.wav'));
  const winPlayer = useAudioPlayer(require('../../assets/sounds/spin-win.wav'));

  const playTick = useCallback(() => {
    Haptics.selectionAsync();
    tickPlayer.seekTo(0);
    tickPlayer.play();
  }, [tickPlayer]);

  const segmentAngle = 360 / rewards.length;
  useAnimatedReaction(
    () => Math.floor(mod360(rotation.value) / segmentAngle),
    (current, previous) => {
      if (previous !== null && current !== previous) {
        scheduleOnRN(playTick);
      }
    },
    [segmentAngle],
  );

  const handleSpinComplete = useCallback(
    (rewardIndex: number) => {
      isSpinningRef.current = false;
      const reward = rewards[rewardIndex];
      setCurrentReward(reward);
      setState('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      winPlayer.seekTo(0);
      winPlayer.play();
      onResult(reward);
    },
    [rewards, onResult, winPlayer],
  );

  const spin = useCallback(() => {
    if (isSpinningRef.current || state !== 'idle' || !canSpin) {
      return;
    }
    isSpinningRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSpinStart();

    const weights = rewards.map((reward) => reward.weight);
    const rewardIndex = pickWeightedIndex(weights);
    const mid = segmentBounds(rewardIndex, rewards.length).mid;
    const target = computeTargetRotation(rotation.value, mid);

    setState('spinning');
    rotation.value = withTiming(target, { duration: SPIN_DURATION_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
      'worklet';
      if (finished) {
        scheduleOnRN(handleSpinComplete, rewardIndex);
      }
    });
  }, [state, canSpin, rewards, onSpinStart, rotation, handleSpinComplete]);

  const dismissResult = useCallback(() => {
    setState('idle');
    setCurrentReward(null);
  }, []);

  return { rotation, state, currentReward, spin, dismissResult };
}
