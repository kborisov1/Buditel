import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { PlayerLabels } from './labels';
import { smallButton } from './shared';

export type SortableItem = { id: string; label: string };

function Row({
  item,
  index,
  count,
  locked,
  labels,
  move,
}: {
  item: SortableItem;
  index: number;
  count: number;
  locked: boolean;
  labels: PlayerLabels;
  move: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: locked,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border-2 bg-white p-3 ${
        isDragging ? 'z-10 border-amber-600 shadow-lg' : 'border-stone-200'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={locked}
        aria-label={labels.dragHandle(item.label)}
        className="cursor-grab touch-none px-1 text-stone-500 disabled:cursor-default"
      >
        ⠿
      </button>
      <span className="flex-1">{item.label}</span>
      <button
        type="button"
        className={smallButton}
        disabled={locked || index === 0}
        aria-label={labels.moveUp(item.label)}
        onClick={() => move(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        className={smallButton}
        disabled={locked || index === count - 1}
        aria-label={labels.moveDown(item.label)}
        onClick={() => move(index, index + 1)}
      >
        ↓
      </button>
    </li>
  );
}

/** A reorderable list: drag with pointer or keyboard, or use the arrow buttons. */
export function SortableList({
  id,
  items,
  initialOrder,
  locked,
  labels,
  onChange,
}: {
  id: string;
  items: SortableItem[];
  initialOrder: string[];
  locked: boolean;
  labels: PlayerLabels;
  onChange: (order: string[]) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const byId = new Map(items.map((i) => [i.id, i]));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function move(from: number, to: number) {
    const next = arrayMove(order, from, to);
    setOrder(next);
    onChange(next);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    move(order.indexOf(String(active.id)), order.indexOf(String(over.id)));
  }

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2">
          {order.map((itemId, index) => (
            <Row
              key={itemId}
              item={byId.get(itemId)!}
              index={index}
              count={order.length}
              locked={locked}
              labels={labels}
              move={move}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
