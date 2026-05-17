"use client";

import { useRef, useState } from "react";

type DayExerciseItem = {
  id: string;
  name: string;
};

export function DayExercisesReorder({
  programId,
  dayId,
  exercises,
  action,
}: {
  programId: string;
  dayId: string;
  exercises: DayExerciseItem[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [draggedId, setDraggedId] = useState("");
  const [dropTargetId, setDropTargetId] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  if (exercises.length < 2) return null;

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <p className="eyebrow">Reorganiser les exercices</p>
      <p className="muted" style={{ marginTop: 0 }}>Glisse un exercice sur un autre pour changer l&apos;ordre.</p>
      <div className="stack" style={{ gap: 8 }}>
        {exercises.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTargetId(item.id);
            }}
            onDrop={() => {
              if (!draggedId || draggedId === item.id) return;
              setDropTargetId(item.id);
              formRef.current?.requestSubmit();
            }}
            className="chip"
            style={{
              cursor: "grab",
              opacity: draggedId === item.id ? 0.6 : 1,
              borderColor: dropTargetId === item.id ? "rgba(110, 165, 255, .8)" : undefined,
            }}
          >
            {item.name}
          </div>
        ))}
      </div>

      <form ref={formRef} action={action} style={{ display: "none" }}>
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="dayId" value={dayId} />
        <input type="hidden" name="draggedExerciseId" value={draggedId} />
        <input type="hidden" name="targetExerciseId" value={dropTargetId} />
      </form>
    </div>
  );
}

