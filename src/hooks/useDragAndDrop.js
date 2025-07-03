import { useCallback } from 'react';

// Custom hook for drag and drop functionality
export function useDragAndDrop(
  filterConditions,
  setFilterConditions,
  conditionGroups,
  setConditionGroups,
  inputValues,
  setInputValues,
  setHasUnprocessedChanges,
  draggedCondition,
  setDraggedCondition,
  dragHoverTarget,
  setDragHoverTarget
) {
  // Drag and drop handlers for reordering conditions
  const handleDragStart = useCallback((e, conditionIndex) => {
    setDraggedCondition(conditionIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', conditionIndex.toString());
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
    console.log(`Started dragging condition ${conditionIndex}`);
  }, [setDraggedCondition]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e, targetIndex) => {
    e.preventDefault();
    if (draggedCondition !== null && draggedCondition !== targetIndex) {
      setDragHoverTarget(targetIndex);
    }
  }, [draggedCondition, setDragHoverTarget]);

  const handleDragLeave = useCallback((e, targetIndex) => {
    // Only clear hover if we're actually leaving this element (not just moving to a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragHoverTarget(null);
    }
  }, [setDragHoverTarget]);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedIndex === targetIndex || isNaN(draggedIndex)) {
      setDragHoverTarget(null);
      return;
    }

    console.log(`Dropping condition ${draggedIndex} at position ${targetIndex}`);
    console.log('Before reordering:', filterConditions.map((c, i) => `${i}: ${c.field}:${c.value || ''}`));

    const newConditions = [...filterConditions];
    const draggedItem = newConditions[draggedIndex];
    
    // Remove the dragged item
    newConditions.splice(draggedIndex, 1);
    
    // Insert at the new position
    // When dragging down (lower index to higher index), we should insert at the target position
    // When dragging up (higher index to lower index), we should insert at the target position
    // This creates a consistent user experience regardless of drag direction
    newConditions.splice(targetIndex, 0, draggedItem);
    
    // Update input values to match new order
    const newInputValues = {};
    newConditions.forEach((condition, newIndex) => {
      const oldIndex = filterConditions.findIndex(c => c.id === condition.id);
      newInputValues[newIndex] = inputValues[oldIndex] || condition.value;
    });
    
    setFilterConditions(newConditions);
    setInputValues(newInputValues);
    setHasUnprocessedChanges(true);
    
    // Clear drag states
    setDragHoverTarget(null);
    
    console.log('New condition order:', newConditions.map((c, i) => `${i}: ${c.field}:${c.value || ''}`));
  }, [filterConditions, inputValues, setFilterConditions, setInputValues, setHasUnprocessedChanges, setDragHoverTarget]);

  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = '1';
    setDraggedCondition(null);
    setDragHoverTarget(null);
  }, [setDraggedCondition, setDragHoverTarget]);

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
}
