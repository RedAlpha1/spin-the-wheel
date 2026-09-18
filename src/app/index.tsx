import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wheel } from '@/components/wheel/Wheel';
import type { WheelSegment } from '@/components/wheel/WheelSegments';

const SEGMENT_COLORS = [
  '#E63946', '#F1A208', '#2A9D8F', '#264653',
  '#8D5B4C', '#457B9D', '#6A4C93', '#F4A261',
  '#1D3557', '#B5838D', '#606C38', '#9B5DE5',
];

const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 12;

function buildSegments(count: number): WheelSegment[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `segment-${index}`,
    label: `${index + 1}`,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
  }));
}

export default function HomeScreen() {
  const [count, setCount] = useState(6);
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.9, 420);
  const segments = buildSegments(count);

  return (
    <SafeAreaView style={styles.container}>
      <Wheel segments={segments} size={size} />
      <View style={styles.controls}>
        <Pressable
          style={styles.button}
          disabled={count <= MIN_SEGMENTS}
          onPress={() => setCount((current) => Math.max(MIN_SEGMENTS, current - 1))}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.countText}>{count} segments</Text>
        <Pressable
          style={styles.button}
          disabled={count >= MAX_SEGMENTS}
          onPress={() => setCount((current) => Math.min(MAX_SEGMENTS, current + 1))}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A0E0E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7A1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 24,
  },
  countText: {
    color: '#ffffff',
    fontSize: 16,
    minWidth: 96,
    textAlign: 'center',
  },
});
