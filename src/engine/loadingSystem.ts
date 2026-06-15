import { Train, Carriage, CandyType, SugarWarehouse } from '@/types';
import { GAME_CONFIG } from '@/data/config';

export function loadCandiesToTrain(
  train: Train,
  candyCounts: Record<CandyType, number>,
  warehouse?: SugarWarehouse
): {
  train: Train;
  warehouse: SugarWarehouse;
  overflow: Record<CandyType, number>;
  totalLoaded: number;
  warehouseLoss: Record<CandyType, number>;
} {
  const newCarriages = train.carriages.map(c => ({ ...c }));
  const newWarehouse: SugarWarehouse = {
    capacity: warehouse?.capacity || GAME_CONFIG.WAREHOUSE_BASE_CAPACITY,
    storage: { ...(warehouse?.storage || {}) },
  };
  const overflow: Record<string, number> = {};
  const warehouseLoss: Record<string, number> = {};
  let totalLoaded = 0;

  for (const candyType of Object.keys(candyCounts) as CandyType[]) {
    let remaining = candyCounts[candyType];
    if (remaining <= 0) continue;

    const carriage = newCarriages.find(c => c.candyType === candyType);

    if (carriage) {
      if (!carriage.isSealed) {
        const availableSpace = carriage.capacity - carriage.currentLoad;
        const toLoad = Math.min(remaining, availableSpace);
        carriage.currentLoad += toLoad;
        totalLoaded += toLoad;
        remaining -= toLoad;
      }

      if (remaining > 0) {
        const currentWarehouseTotal = Object.values(newWarehouse.storage).reduce((a, b) => a + (b || 0), 0);
        const warehouseSpace = newWarehouse.capacity - currentWarehouseTotal;
        const toWarehouse = Math.min(remaining, warehouseSpace);

        if (toWarehouse > 0) {
          newWarehouse.storage[candyType] = (newWarehouse.storage[candyType] || 0) + toWarehouse;
          remaining -= toWarehouse;
        }

        if (remaining > 0) {
          overflow[candyType] = remaining;
        }
      }
    } else {
      const currentWarehouseTotal = Object.values(newWarehouse.storage).reduce((a, b) => a + (b || 0), 0);
      const warehouseSpace = newWarehouse.capacity - currentWarehouseTotal;
      const toWarehouse = Math.min(remaining, warehouseSpace);

      if (toWarehouse > 0) {
        newWarehouse.storage[candyType] = (newWarehouse.storage[candyType] || 0) + toWarehouse;
        remaining -= toWarehouse;
      }

      if (remaining > 0) {
        overflow[candyType] = remaining;
      }
    }
  }

  const warehouseTotal = Object.values(newWarehouse.storage).reduce((a, b) => a + (b || 0), 0);
  if (warehouseTotal >= newWarehouse.capacity) {
    for (const candyType of Object.keys(newWarehouse.storage) as CandyType[]) {
      const stored = newWarehouse.storage[candyType] || 0;
      if (stored > 0) {
        const loss = Math.floor(stored * GAME_CONFIG.WAREHOUSE_LOSS_RATE);
        if (loss > 0) {
          warehouseLoss[candyType] = loss;
          newWarehouse.storage[candyType] = stored - loss;
        }
      }
    }
  }

  return {
    train: { ...train, carriages: newCarriages },
    warehouse: newWarehouse,
    overflow: overflow as Record<CandyType, number>,
    totalLoaded,
    warehouseLoss: warehouseLoss as Record<CandyType, number>,
  };
}

export function getWarehouseLoad(warehouse: SugarWarehouse): number {
  return Object.values(warehouse.storage).reduce((a, b) => a + (b || 0), 0);
}

export function getWarehousePercentage(warehouse: SugarWarehouse): number {
  if (warehouse.capacity === 0) return 0;
  return (getWarehouseLoad(warehouse) / warehouse.capacity) * 100;
}

export function isWarehouseFull(warehouse: SugarWarehouse): boolean {
  return getWarehouseLoad(warehouse) >= warehouse.capacity;
}

export function transferWarehouseToTrain(
  train: Train,
  warehouse: SugarWarehouse,
  carriageId: string
): {
  train: Train;
  warehouse: SugarWarehouse;
  transferred: number;
} {
  const newCarriages = train.carriages.map(c => ({ ...c }));
  const carriage = newCarriages.find(c => c.id === carriageId);
  if (!carriage || carriage.isSealed) {
    return { train, warehouse, transferred: 0 };
  }

  const candyType = carriage.candyType;
  const available = warehouse.storage[candyType] || 0;
  const space = carriage.capacity - carriage.currentLoad;
  const toTransfer = Math.min(available, space);

  if (toTransfer <= 0) {
    return { train, warehouse, transferred: 0 };
  }

  const newStorage = { ...warehouse.storage };
  newStorage[candyType] = available - toTransfer;
  if (newStorage[candyType] === 0) {
    delete newStorage[candyType];
  }

  carriage.currentLoad += toTransfer;

  return {
    train: { ...train, carriages: newCarriages },
    warehouse: { ...warehouse, storage: newStorage },
    transferred: toTransfer,
  };
}

export function clearWarehouse(warehouse: SugarWarehouse): SugarWarehouse {
  return {
    ...warehouse,
    storage: {},
  };
}

export function getLoadPercentage(carriage: Carriage): number {
  if (carriage.capacity === 0) return 0;
  return (carriage.currentLoad / carriage.capacity) * 100;
}

export function getTotalLoad(train: Train): number {
  return train.carriages.reduce((sum, c) => sum + c.currentLoad, 0);
}

export function getTotalCapacity(train: Train): number {
  return train.carriages.reduce((sum, c) => sum + c.capacity, 0);
}

export function isTrainFull(train: Train): boolean {
  return train.carriages.every(c => c.currentLoad >= c.capacity);
}

export function getTrainLoadPercentage(train: Train): number {
  const totalLoad = getTotalLoad(train);
  const totalCapacity = getTotalCapacity(train);
  if (totalCapacity === 0) return 0;
  return (totalLoad / totalCapacity) * 100;
}

export function clearTrain(train: Train): Train {
  return {
    ...train,
    carriages: train.carriages.map(c => ({ ...c, currentLoad: 0, isSealed: false })),
  };
}

export function getCandyLoad(train: Train, candyType: CandyType): number {
  const carriage = train.carriages.find(c => c.candyType === candyType);
  return carriage?.currentLoad || 0;
}

export function sealCarriage(train: Train, carriageId: string): Train {
  return {
    ...train,
    carriages: train.carriages.map(c =>
      c.id === carriageId ? { ...c, isSealed: true } : c
    ),
  };
}

export function unsealCarriage(train: Train, carriageId: string): Train {
  return {
    ...train,
    carriages: train.carriages.map(c =>
      c.id === carriageId ? { ...c, isSealed: false } : c
    ),
  };
}

export function canSealCarriage(carriage: Carriage): boolean {
  if (carriage.isSealed) return false;
  const loadRate = carriage.currentLoad / carriage.capacity;
  return loadRate >= GAME_CONFIG.SEAL_THRESHOLD_RATE;
}
