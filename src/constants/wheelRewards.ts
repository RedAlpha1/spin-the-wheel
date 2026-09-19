import type { ImageSourcePropType } from 'react-native';

export type RewardKind = 'gold' | 'extraSpin' | 'grandPrize' | 'noWin';

export type WheelReward = {
  id: string;
  kind: RewardKind;
  label: string;
  icon: ImageSourcePropType;
  colors: [string, string];
  coinValue: number;
  weight: number;
};

export const WHEEL_REWARDS: WheelReward[] = [
  {
    id: 'extra-spin',
    kind: 'extraSpin',
    label: 'Extra Spin',
    icon: require('../../assets/images/wheel/reward-icon-extra-spin.png'),
    colors: ['#4A6CF7', '#1E3A8A'],
    coinValue: 0,
    weight: 10,
  },
  {
    id: 'gold-1',
    kind: 'gold',
    label: 'Free Gold',
    icon: require('../../assets/images/wheel/reward-icon-gold.png'),
    colors: ['#FFCF87', '#C9971F'],
    coinValue: 10,
    weight: 25,
  },
  {
    id: 'no-win',
    kind: 'noWin',
    label: 'Try Again',
    icon: require('../../assets/images/wheel/reward-icon-no-win.png'),
    colors: ['#97004C', '#55052D'],
    coinValue: 0,
    weight: 20,
  },
  {
    id: 'gold-2',
    kind: 'gold',
    label: 'Free Gold',
    icon: require('../../assets/images/wheel/reward-icon-gold.png'),
    colors: ['#FFCF87', '#C9971F'],
    coinValue: 10,
    weight: 20,
  },
  {
    id: 'grand-prize',
    kind: 'grandPrize',
    label: 'Grand Prize',
    icon: require('../../assets/images/wheel/reward-icon-grand-prize.png'),
    colors: ['#6A4C93', '#3C0185'],
    coinValue: 100,
    weight: 5,
  },
  {
    id: 'gold-3',
    kind: 'gold',
    label: 'Free Gold',
    icon: require('../../assets/images/wheel/reward-icon-gold.png'),
    colors: ['#FFCF87', '#C9971F'],
    coinValue: 10,
    weight: 20,
  },
];
