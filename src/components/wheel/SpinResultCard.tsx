import { Image } from 'expo-image';
import { useEffect, useEffectEvent } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { WheelReward } from '@/constants/wheelRewards';

const AUTO_DISMISS_MS = 2000;

// Scaled off screen width, same 390pt baseline as the home screen's chrome
// — see src/app/index.tsx for why (Android's device spread is wide).
const ICON_RATIO = 80 / 390;
const PADDING_V_RATIO = 32 / 390;
const PADDING_H_RATIO = 40 / 390;
const LABEL_FONT_RATIO = 20 / 390;

type Props = {
  reward: WheelReward;
  onDismiss: () => void;
};

export function SpinResultCard({ reward, onDismiss }: Props) {
  const { width } = useWindowDimensions();
  const onDismissEvent = useEffectEvent(() => {
    onDismiss();
  });

  useEffect(() => {
    const timer = setTimeout(() => onDismissEvent(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { paddingVertical: width * PADDING_V_RATIO, paddingHorizontal: width * PADDING_H_RATIO },
          ]}>
          <Image
            source={reward.icon}
            style={{ width: width * ICON_RATIO, height: width * ICON_RATIO }}
            contentFit="contain"
          />
          <Text style={[styles.label, { fontSize: width * LABEL_FONT_RATIO }]}>{reward.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    backgroundColor: '#4F031B',
    borderWidth: 2,
    borderColor: '#FFCF87',
  },
  label: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
