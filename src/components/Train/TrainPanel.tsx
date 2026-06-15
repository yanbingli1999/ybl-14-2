import useGameStore from '@/store/useGameStore';
import CarriageCard from './CarriageCard';
import {
  getTrainLoadPercentage,
  getTotalLoad,
  getTotalCapacity,
  getWarehouseLoad,
  getWarehousePercentage,
  isWarehouseFull,
} from '@/engine/loadingSystem';
import { Train as TrainIcon, Package, Sparkles, AlertTriangle } from 'lucide-react';
import { CANDY_CONFIG, GAME_CONFIG } from '@/data/config';
import { CandyType } from '@/types';

export default function TrainPanel() {
  const {
    train,
    dispatchTrain,
    gamePhase,
    isAnimating,
    moves,
    sugarWarehouse,
    rewardMultiplier,
    warehouseLossMessage,
  } = useGameStore();

  const loadPercent = getTrainLoadPercentage(train);
  const totalLoad = getTotalLoad(train);
  const totalCapacity = getTotalCapacity(train);
  const canDispatch = totalLoad > 0 && gamePhase === 'playing' && !isAnimating;

  const warehouseLoad = getWarehouseLoad(sugarWarehouse);
  const warehousePercent = getWarehousePercentage(sugarWarehouse);
  const warehouseFull = isWarehouseFull(sugarWarehouse);

  const sealedCount = train.carriages.filter(c => c.isSealed).length;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-lg border-2 border-amber-200">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TrainIcon className="w-6 h-6 text-amber-700" />
        <h3 className="text-lg font-bold text-amber-900">{train.name}</h3>
        <span className="text-sm text-amber-600 ml-auto">
          {totalLoad}/{totalCapacity} ({Math.round(loadPercent)}%)
        </span>
      </div>

      {(rewardMultiplier > GAME_CONFIG.BASE_REWARD_MULTIPLIER || sealedCount > 0) && (
        <div className="flex items-center gap-2 mb-3 text-sm flex-wrap">
          {rewardMultiplier > GAME_CONFIG.BASE_REWARD_MULTIPLIER && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full border border-amber-300">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">
                奖励倍率 x{rewardMultiplier.toFixed(1)}
              </span>
            </div>
          )}
          {sealedCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full border border-orange-300">
              <span className="font-bold text-orange-700">
                🔒 已封签 {sealedCount}/{train.carriages.length}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="relative overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {train.carriages.map((carriage) => (
            <CarriageCard key={carriage.id} carriage={carriage} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 rounded-full" />
      </div>

      <div className={`mt-4 p-3 rounded-xl border-2 transition-all duration-300 ${
        warehouseFull
          ? 'bg-red-50 border-red-300'
          : warehouseLoad > 0
            ? 'bg-sky-50 border-sky-300'
            : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Package className={`w-5 h-5 ${warehouseFull ? 'text-red-600' : 'text-sky-600'}`} />
          <h4 className={`font-bold text-sm ${warehouseFull ? 'text-red-700' : 'text-sky-700'}`}>
            临时糖仓
          </h4>
          <span className={`text-xs ml-auto font-medium ${
            warehouseFull ? 'text-red-600' : 'text-sky-600'
          }`}>
            {warehouseLoad}/{sugarWarehouse.capacity} ({Math.round(warehousePercent)}%)
          </span>
          {warehouseFull && (
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              warehouseFull
                ? 'bg-gradient-to-r from-red-400 to-red-600'
                : 'bg-gradient-to-r from-sky-400 to-sky-600'
            }`}
            style={{ width: `${Math.min(warehousePercent, 100)}%` }}
          />
        </div>

        {warehouseLoad > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(sugarWarehouse.storage).map(([type, count]) => {
              if (!count) return null;
              const config = CANDY_CONFIG[type as CandyType];
              return (
                <div
                  key={type}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <span className="text-sm">{config.emoji}</span>
                  <span className="text-xs font-bold text-gray-700">+{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {warehouseLoad === 0 && (
          <p className="text-xs text-gray-400 italic">
            糖仓为空，封签车厢的糖果会储存在这里
          </p>
        )}

        {warehouseFull && (
          <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            糖仓已满！继续消除将按类型损耗 {Math.round(GAME_CONFIG.WAREHOUSE_LOSS_RATE * 100)}%
          </p>
        )}
      </div>

      {warehouseLossMessage && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm font-medium animate-pulse">
          ⚠️ {warehouseLossMessage}
        </div>
      )}

      <button
        onClick={dispatchTrain}
        disabled={!canDispatch}
        className={`w-full mt-4 py-3 px-6 rounded-xl font-bold text-white text-lg
          transition-all duration-200 transform
          ${canDispatch
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 cursor-not-allowed'
          }`}
      >
        🚂 发车！
      </button>

      {moves <= 0 && gamePhase === 'playing' && (
        <p className="text-center text-red-500 text-sm mt-2 font-medium">
          步数已用完，请发车结束本局
        </p>
      )}

      <div className="mt-3 p-2 bg-white/60 rounded-lg text-xs text-amber-800 space-y-1">
        <p>💡 <strong>封签技巧</strong>：装载率≥{Math.round(GAME_CONFIG.SEAL_THRESHOLD_RATE * 100)}%可封签</p>
        <p>🏆 发车时封签车厢<strong>刚好匹配</strong>订单可额外+{GAME_CONFIG.SEAL_REPUTATION_BONUS}信誉</p>
        <p>💰 拆封需消耗 {GAME_CONFIG.UNSEAL_COIN_COST} 金币并重置奖励倍率</p>
      </div>
    </div>
  );
}
