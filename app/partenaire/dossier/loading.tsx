import { Skeleton } from "@/components/ui";

/** Le rail des huit étapes reste affiché ; seule l'étape clignote. */
export default function Loading() {
  return (
    <div
      className="flex flex-col gap-5 rounded-[20px] bg-white p-7 shadow-[0_10px_24px_rgba(15,39,77,0.10)]"
      aria-busy="true"
    >
      <Skeleton className="h-6 w-52" />
      <Skeleton className="h-4 w-full max-w-[62ch]" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[52px] rounded-[14px]" />
        ))}
      </div>
    </div>
  );
}
