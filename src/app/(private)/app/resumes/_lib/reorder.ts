export type ResumeReorderItem = {
  id: string;
  sortOrder: number;
};

const SORT_ORDER_STEP = 10;
const INITIAL_SORT_ORDER = 10;

export function reorderResumeItems(
  items: ResumeReorderItem[],
  draggedId: string,
  targetId: string,
): ResumeReorderItem[] {
  if (draggedId === targetId) {
    return [...items];
  }

  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const toIndex = items.findIndex((item) => item.id === targetId);

  if (fromIndex < 0 || toIndex < 0) {
    return [...items];
  }

  const reordered = [...items];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered;
}

export function applySortOrderByIndex(items: ResumeReorderItem[]): ResumeReorderItem[] {
  return items.map((item, index) => ({
    id: item.id,
    sortOrder: INITIAL_SORT_ORDER + index * SORT_ORDER_STEP,
  }));
}
