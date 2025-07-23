/**
 * inventoryCalculations.js
 * Utility functions for calculating essential reserve and amount needed for inventory parts/groups.
 */

/**
 * Calculates essential reserve and amount needed for a part/group.
 *
 * @param {Object} params
 * @param {number} [params.total] - Total quantity of the item
 * @param {number} [params.spare] - Spare quantity available
 * @param {number} [params.spareThreshold] - Spare threshold (percentage, 0-1)
 * @returns {{ essentialReserve: number, amountNeeded: number, inUse: number }}
 */
export function calculateInventoryReserve({ total = 0, spare = 0, inUse, spareThreshold = 0 }) {
  // Use provided inUse if available, else calculate
  const actualInUse = typeof inUse === 'number' ? inUse : total - spare;
  const calculatedReserve = Math.round(actualInUse * spareThreshold);
  let essentialReserve, amountNeeded;
  if (calculatedReserve > spare) {
    essentialReserve = spare;
    amountNeeded = calculatedReserve - spare;
  } else {
    essentialReserve = calculatedReserve;
    amountNeeded = 0;
  }
  const usableSurplus = Math.max(0, spare - calculatedReserve);
  const shouldBulkOrder = amountNeeded > 0;
  return { essentialReserve, amountNeeded, usableSurplus, inUse: actualInUse, shouldBulkOrder };
}

/**
 * Convenience function to extract values from a part/group object.
 * @param {Object} part - Part or group object
 * @returns {{ essentialReserve: number, amountNeeded: number, usableSurplus: number, inUse: number }}
 */
export function getInventoryReserveFromPart(part) {
  const total = part.total ?? 0;
  const spare = part.spare ?? 0;
  // Use inUse from object if present
  const inUse = typeof part.inUse === 'number' ? part.inUse : undefined;
  // Use spare_value as threshold if present, else 0; convert if > 1
  let spareThreshold = part.spare_value ?? 0;
  if (spareThreshold > 1) spareThreshold = spareThreshold / 100;
  return calculateInventoryReserve({ total, spare, inUse, spareThreshold });
}
