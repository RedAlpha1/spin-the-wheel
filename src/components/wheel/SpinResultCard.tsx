import { Image } from 'expo-image';
import { useEffect, useEffectEvent } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WheelReward } from '@/constants/wheelRewards';

const AUTO_DISMISS_MS = 2000;

type Props = {
  reward: WheelReward;
  onDismiss: () => void;
};

export function SpinResultCard({ reward, onDismiss }: Props) {
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
        <View style={styles.card}>
          <Image source={reward.icon} style={styles.icon} contentFit="contain" />
          <Text style={styles.label}>{reward.label}</Text>
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
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 24,
    backgroundColor: '#4F031B',
    borderWidth: 2,
    borderColor: '#FFCF87',
  },
  icon: {
    width: 80,
    height: 80,
  },
  label: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
