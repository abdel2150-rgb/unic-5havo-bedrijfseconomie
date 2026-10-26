import {
  DndContext,
  useDraggable,
  useDroppable,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Field } from "../lib/exercises";

function Item({ field, selected }: { field: Field; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: field.id,
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={"drag-item " + (selected ? "assigned" : "")}
    >
      <GripVertical size={15} />
      {field.label}
    </button>
  );
}
function Zone({ name, children }: { name: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: name });
  return (
    <div ref={setNodeRef} className={"drop-zone " + (isOver ? "over" : "")}>
      <strong>{name}</strong>
      {children}
    </div>
  );
}
export function SortTrainer({
  fields,
  answers,
  onChange,
  disabled = false,
}: {
  fields: Field[];
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}) {
  const categories = Array.from(
    new Set(fields.flatMap((f) => f.options ?? [])),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  function end(e: DragEndEvent) {
    if (!disabled && e.over) onChange(String(e.active.id), String(e.over.id));
  }
  return (
    <>
      <p className="small muted">
        Sleep een post naar een vak. Je kunt ook de keuzelijsten hieronder
        gebruiken. Slepen met toetsenbord: spatie, pijltjes, spatie.
      </p>
      <DndContext sensors={sensors} onDragEnd={end}>
        <div className="drag-pool">
          {fields
            .filter((f) => !answers[f.id])
            .map((f) => (
              <Item key={f.id} field={f} selected={false} />
            ))}
        </div>
        <div className="drop-grid">
          {categories.map((name) => (
            <Zone key={name} name={name}>
              {fields
                .filter((f) => answers[f.id] === name)
                .map((f) => (
                  <Item key={f.id} field={f} selected />
                ))}
            </Zone>
          ))}
        </div>
      </DndContext>
    </>
  );
}
