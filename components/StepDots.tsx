/** Barre de progression du tunnel de création (5 étapes). */
export function StepDots({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <div className="mb-4 flex gap-[5px]" aria-label={`Étape ${current} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i < current ? "bg-teal" : "bg-line"}`}
        />
      ))}
    </div>
  );
}
