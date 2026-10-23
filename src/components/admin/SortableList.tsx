"use client";

import type { ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

/**
 * A list put in order by dragging each row's handle — with the mouse, a
 * finger, or the keyboard (space, the arrows, space) — as "Ana Sayfa
 * Düzenleme"'s sections are. `onReorder` gets the whole new order and the
 * id of the item moved; the caller shows it at once and saves it.
 */
export function SortableList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  renderItem,
  disabled = false,
  className = "",
}: {
  items: T[];
  getId: (item: T) => string;
  /** What a screen reader hears for an item while it is moved. */
  getLabel: (item: T) => string;
  onReorder: (items: T[], movedId: string) => void;
  /** One row; `handle` is the drag handle to place in it. */
  renderItem: (item: T, handle: ReactNode, index: number) => ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  const labelOf = (id: string | number) => {
    const item = items.find((x) => getId(x) === String(id));
    return item ? getLabel(item) : "";
  };
  const placeOf = (id: string | number) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${labelOf(active.id)} tutuldu.`,
    onDragOver: ({ active, over }) => (over ? `${labelOf(active.id)}, ${placeOf(over.id)}. sırada.` : ""),
    onDragEnd: ({ active, over }) => (over ? `${labelOf(active.id)} ${placeOf(over.id)}. sıraya bırakıldı.` : ""),
    onDragCancel: ({ active }) => `${labelOf(active.id)} yerinde kaldı.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(items, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))), String(active.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "Taşımak için boşluk tuşuna basın, okla yer değiştirin, bırakmak için yeniden boşluğa basın; vazgeçmek için Escape.",
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)} label={getLabel(item)} disabled={disabled}>
              {(handle) => renderItem(item, handle, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  label,
  disabled,
  children,
}: {
  id: string;
  label: string;
  disabled: boolean;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Taşı: ${label}`}
      className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-red-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-zinc-200"
    >
      <GripVertical className="h-4 w-4" aria-hidden />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative bg-white dark:bg-zinc-900 ${isDragging ? "z-10 rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-white/10" : ""}`}
    >
      {children(handle)}
    </li>
  );
}
