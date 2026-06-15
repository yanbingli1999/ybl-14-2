import { Carriage } from '@/types';
import { CANDY_CONFIG, GAME_CONFIG } from '@/data/config';
import { getLoadPercentage } from '@/engine/loadingSystem';
import useGameStore from '@/store/useGameStore';
import { Lock, Unlock, ArrowDownToLine } from 'lucide-react';

interface CarriageCardProps {
  carriage: Carriage;
}

export default function CarriageCard({ carriage }: CarriageCardProps) {
  const config = CANDY_CONFIG[carriage.candyType];
  const loadPercent = getLoadPercentage(carriage);
  const isFull = loadPercent >= 100;

  const {
    sealCarriage,
    unsealCarriage,
    transferFromWarehouse,
    canSealCarriageWithOrder,
    profile,
    isAnimating,
    gamePhase,
    currentOrder,
    sugarWarehouse,
  } = useGameStore();

  const disabled = isAnimating || gamePhase !== 'playing';
  const canSeal = canSealCarriageWithOrder(carriage.id) && !disabled;
  const canUnseal = carriage.isSealed && profile.coins >= GAME_CONFIG.UNSEAL_COIN_COST && !disabled;

  const orderItem = currentOrder?.items.find(i => i.candyType === carriage.candyType);
  const warehouseCount = sugarWarehouse.storage[carriage.candyType] || 0;
  const canTransfer = warehouseCount > 0 && !carriage.isSealed && carriage.currentLoad < carriage.capacity && !disabled;
  const spaceAvailable = carriage.capacity - carriage.currentLoad;
  const transferAmount = Math.min(warehouseCount, spaceAvailable);

  const handleSeal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canSeal) {
      sealCarriage(carriage.id);
    }
  };

  const handleUnseal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canUnseal) {
      const confirmed = window.confirm(
        `拆封需要消耗 ${GAME_CONFIG.UNSEAL_COIN_COST} 金币，并重置奖励倍率。\n糖仓中的 ${config.emoji} x${warehouseCount} 将自动转入车厢。\n确定要拆封吗？`
      );
      if (confirmed) {
        unsealCarriage(carriage.id);
      }
    }
  };

  const handleTransfer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canTransfer) {
      const transferred = transferFromWarehouse(carriage.id);
      if (transferred > 0) {
        console.log(`已转入 ${transferred} 个 ${config.name} 到车厢`);
      }
    }
  };

  const getSealHint = () => {
    if (!orderItem) {
      return `装载率≥${Math.round(GAME_CONFIG.SEAL_THRESHOLD_RATE * 100)}%可封签`;
    }
    return `接近订单量 ${orderItem.quantity} 可封签`;
  };

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-xl shadow-md border-2 min-w-[70px] sm:min-w-[80px] transition-all duration-300 ${
        carriage.isSealed
          ? 'bg-gradient-to-b from-amber-100 to-amber-200 border-amber-400 ring-2 ring-amber-300'
          : 'bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300'
      }`}
      style={{
        borderColor: carriage.isSealed ? '#f59e0b' : config.color + '40',
      }}
    >
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <div
        className="absolute -top-1 left-1/4 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <div
        className="absolute -top-1 right-1/4 translate-x-1/2 w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />

      {carriage.isSealed && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Lock className="w-3 h-3" />
            已封签
          </div>
        </div>
      )}

      <div className="text-2xl sm:text-3xl mb-1 relative">
        {config.emoji}
        {carriage.isSealed && (
          <div className="absolute -top-1 -right-1 text-sm">🔒</div>
        )}
      </div>

      <div className={`text-xs font-bold mb-0.5 ${carriage.isSealed ? 'text-amber-700' : 'text-gray-700'}`}>
        {carriage.currentLoad}/{carriage.capacity}
      </div>

      {orderItem && (
        <div className="text-[10px] text-gray-500 mb-1">
          📋 订单: {orderItem.quantity}
        </div>
      )}

      <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(loadPercent, 100)}%`,
            backgroundColor: carriage.isSealed ? '#f59e0b' : config.color,
            boxShadow: isFull ? `0 0 8px ${carriage.isSealed ? '#f59e0b' : config.color}` : 'none',
          }}
        />
      </div>

      {!carriage.isSealed && canSeal && (
        <button
          onClick={handleSeal}
          className="mt-1 w-full py-1 px-2 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-md hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
          title={getSealHint()}
        >
          <Lock className="w-3 h-3" />
          封签
        </button>
      )}

      {!carriage.isSealed && canTransfer && (
        <button
          onClick={handleTransfer}
          className="mt-1 w-full py-1 px-2 text-[10px] font-bold text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-md hover:from-sky-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
          title={`从糖仓转入 ${transferAmount} 个 ${config.name}`}
        >
          <ArrowDownToLine className="w-3 h-3" />
          转入 x{transferAmount}
        </button>
      )}

      {carriage.isSealed && (
        <button
          onClick={handleUnseal}
          disabled={!canUnseal}
          className={`mt-1 w-full py-1 px-2 text-[10px] font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-1 shadow-sm ${
            canUnseal
              ? 'text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
              : 'text-gray-400 bg-gray-300 cursor-not-allowed'
          }`}
          title={`拆封需要 ${GAME_CONFIG.UNSEAL_COIN_COST} 金币`}
        >
          <Unlock className="w-3 h-3" />
          拆封
        </button>
      )}

      {warehouseCount > 0 && !carriage.isSealed && !canTransfer && (
        <div className="mt-1 text-[9px] text-sky-600 text-center">
          糖仓: +{warehouseCount}
        </div>
      )}

      {isFull && !carriage.isSealed && (
        <div className="absolute -top-2 -right-2 text-lg animate-bounce">✨</div>
      )}

      {orderItem && Math.abs(carriage.currentLoad - orderItem.quantity) <= 2 && !carriage.isSealed && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
            接近订单
          </div>
        </div>
      )}
    </div>
  );
}
