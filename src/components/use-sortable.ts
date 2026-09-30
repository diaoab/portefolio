"use client";

import { useEffect, useState, useTransition } from "react";

/**
 * Réorganisation par glisser-déposer (HTML5 natif, sans dépendance).
 * `bind(i)` renvoie les propriétés à poser sur chaque élément déplaçable.
 */
export function useSortable<T extends { id: string }>(items: T[], save: (ids: string[]) => Promise<void>) {
  const [list, setList] = useState(items);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => setList(items), [items]);

  const bind = (i: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragging(i);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (over !== i) setOver(i);
    },
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragging;
      setDragging(null);
      setOver(null);
      if (from === null || from === i) return;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved!);
      setList(next);
      start(() => save(next.map((x) => x.id)));
    },
    "data-dragging": dragging === i || undefined,
    "data-over": (over === i && dragging !== null && dragging !== i) || undefined,
  });

  return { list, bind, pending };
}
