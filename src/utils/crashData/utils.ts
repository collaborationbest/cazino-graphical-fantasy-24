
import { wsData } from './data';
import { CrashDataPoint } from './types';

// Get max value from the data
export const getMaxMultiplier = (): number => {
  return Math.max(...wsData.map(point => point.v));
};

// Get a slice of data up to a specific multiplier value
export const getDataSlice = (currentMultiplier: number): CrashDataPoint[] => {
  return wsData.filter(point => point.v <= currentMultiplier);
};

// Get the final crash point from the data
export const getCrashPoint = (): number => {
  return wsData[wsData.length - 1].v;
};

// Find the closest data index to the current multiplier
export const getClosestDataIndex = (targetMultiplier: number): number => {
  // If we're beyond the data, return the last index
  if (targetMultiplier >= wsData[wsData.length - 1].v) {
    return wsData.length - 1;
  }
  
  // Find the index of the first data point with value >= targetMultiplier
  const index = wsData.findIndex(point => point.v >= targetMultiplier);
  return index >= 0 ? index : 0;
};
