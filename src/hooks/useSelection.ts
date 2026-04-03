"use client";
import { useState, useCallback } from "react";

export function useSelection({ allIds }: { allIds: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const isAllSelected = selectedIds.length === allIds.length && allIds.length > 0;
  const selectedCount = selectedIds.length;

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds([...allIds]);
  }, [allIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    isSelectionMode,
    isAllSelected,
    selectedCount,
    toggleSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    exitSelectionMode,
  };
}
