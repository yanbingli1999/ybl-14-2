import { Train, StationOrder, DispatchResult, OrderItem, CandyType } from '@/types';
import { GAME_CONFIG } from '@/data/config';
import { getCandyLoad } from './loadingSystem';

export function calculateDispatchResult(
  train: Train,
  order: StationOrder,
  rewardMultiplier: number = 1.0
): DispatchResult {
  const correctItems: OrderItem[] = [];
  const mismatches: OrderItem[] = [];
  let matchPoints = 0;
  let totalRequired = 0;
  let sealedBonus = 0;
  let perfectlyMatchedSealed = 0;

  for (const item of order.items) {
    const loaded = getCandyLoad(train, item.candyType);
    totalRequired += item.quantity;

    if (loaded >= item.quantity) {
      correctItems.push({ ...item });
      matchPoints += item.quantity;

      const carriage = train.carriages.find(c => c.candyType === item.candyType);
      if (carriage?.isSealed && carriage.currentLoad === item.quantity) {
        perfectlyMatchedSealed++;
      }
    } else if (loaded > 0) {
      correctItems.push({ candyType: item.candyType, quantity: loaded });
      mismatches.push({ candyType: item.candyType, quantity: item.quantity - loaded });
      matchPoints += loaded;
    } else {
      mismatches.push({ ...item });
    }
  }

  for (const carriage of train.carriages) {
    const inOrder = order.items.find(i => i.candyType === carriage.candyType);
    if (!inOrder && carriage.currentLoad > 0) {
      mismatches.push({ candyType: carriage.candyType, quantity: carriage.currentLoad });
    }
  }

  const matchRate = totalRequired > 0 ? matchPoints / totalRequired : 0;
  const success = matchRate >= 0.8;

  sealedBonus = perfectlyMatchedSealed * GAME_CONFIG.SEAL_REPUTATION_BONUS;

  let reward = 0;
  if (success) {
    reward = Math.floor(order.reward * rewardMultiplier);
    if (order.isUrgent) {
      reward += Math.floor(order.reward * GAME_CONFIG.URGENT_BONUS_RATE);
    }
  }

  let penalty = 0;
  if (mismatches.length > 0) {
    penalty = Math.floor(order.reward * GAME_CONFIG.MISMATCH_PENALTY_RATE) * mismatches.length;
    penalty = Math.min(penalty, order.penalty);
  }

  const baseReputationChange = success
    ? GAME_CONFIG.REPUTATION_PER_SUCCESS
    : GAME_CONFIG.REPUTATION_PER_FAIL;

  const reputationChange = baseReputationChange + sealedBonus;

  return {
    success,
    matchRate,
    reward,
    penalty,
    mismatches,
    correctItems,
    reputationChange,
    sealedBonus,
    unsealedPenalty: 0,
  };
}

export function calculateUnsealPenalty(
  train: Train,
  carriageId: string
): { coinCost: number; multiplierReset: boolean } {
  const carriage = train.carriages.find(c => c.id === carriageId);
  if (!carriage || !carriage.isSealed) {
    return { coinCost: 0, multiplierReset: false };
  }

  return {
    coinCost: GAME_CONFIG.UNSEAL_COIN_COST,
    multiplierReset: GAME_CONFIG.UNSEAL_MULTIPLIER_RESET,
  };
}

export function canDispatch(train: Train): boolean {
  const totalLoad = train.carriages.reduce((sum, c) => sum + c.currentLoad, 0);
  return totalLoad > 0;
}

export function getMatchColor(matchRate: number): string {
  if (matchRate >= 0.9) return '#6BCB77';
  if (matchRate >= 0.7) return '#FFD93D';
  if (matchRate >= 0.5) return '#FF9F43';
  return '#FF4757';
}
