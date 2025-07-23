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
/**
 * Calculates inventory reserve metrics for a part/group.
 *
 * Logic:
 * - inUse: Number of items currently in use. If not provided, calculated as (total - spare).
 * - calculatedReserve: The required reserve, calculated as Math.round(inUse * spareThreshold).
 * - essentialReserve: The actual reserve to keep on hand. If calculatedReserve > spare, set to spare (can't reserve more than you have). Otherwise, set to calculatedReserve.
 * - amountNeeded: If calculatedReserve > spare, this is the shortfall (calculatedReserve - spare). Otherwise, 0.
 * - usableSurplus: The number of spare items above the calculated reserve (spare - calculatedReserve), never negative.
 * - shouldBulkOrder: True if amountNeeded > 0 (i.e., you need to order more to meet the reserve).
 *
 * @param {Object} params
 * @param {number} [params.total] - Total quantity of the item (in use + spare)
 * @param {number} [params.spare] - Number of items available as spare
 * @param {number} [params.inUse] - Number of items currently in use (optional)
 * @param {number} [params.spareThreshold] - Spare threshold (as a fraction, e.g., 0.1 for 10%)
 * @returns {{
 *   essentialReserve: number, // The minimum number of spares to keep on hand
 *   amountNeeded: number,     // How many more are needed to meet the reserve
 *   usableSurplus: number,    // Spares above the calculated reserve
 *   inUse: number,            // Number of items in use
 *   shouldBulkOrder: boolean  // True if a bulk order is needed
 * }}
 */
export function calculateInventoryReserve({ total = 0, spare = 0, inUse, spareThreshold = 0 }) {
  // Determine how many items are in use. If not provided, calculate as total - spare.
  const actualInUse = typeof inUse === 'number' ? inUse : total - spare;

  // Calculate the reserve needed based on the threshold (rounded to nearest integer).
  const calculatedReserve = Math.round(actualInUse * spareThreshold);

  let essentialReserve, amountNeeded;

  // If the calculated reserve is greater than the number of spares, you can't reserve more than you have.
  // In this case, set essentialReserve to the number of spares, and amountNeeded to the shortfall.
  if (calculatedReserve > spare) {
    essentialReserve = spare;
    amountNeeded = calculatedReserve - spare;
  } else {
    // Otherwise, you have enough spares to meet the reserve.
    essentialReserve = calculatedReserve;
    amountNeeded = 0;
  }

  // Usable surplus is any spare above the calculated reserve (never negative).
  const usableSurplus = Math.max(0, spare - calculatedReserve);

  // shouldBulkOrder is true if you need to order more to meet the reserve.
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
