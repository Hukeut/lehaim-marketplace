/** Briques du back-office : cartes de chiffres, tableaux, états vides. */

export function AdminTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-[28px] font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[18px] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-2.5 text-[12.5px] font-extrabold tracking-[0.03em] text-ink/65 uppercase">
        {label}
      </div>
      <div className="font-display text-[30px] font-semibold">{value}</div>
      {hint && <div className="mt-1 text-[12px] font-bold text-ink/45">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

/** Tableau : la largeur déborde volontiers, il défile dans sa propre boîte. */
export function AdminTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[18px] bg-white shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[720px] border-collapse text-start">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column}
                className="px-5 py-3.5 text-start text-[12px] font-extrabold tracking-[0.03em] text-ink/45 uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      className={`border-b border-line-soft px-5 py-3.5 text-[13.5px] ${muted ? "text-ink/55" : "font-bold"}`}
    >
      {children}
    </td>
  );
}

/**
 * Tons du back-office. Les trois premiers viennent des boutiques ; les quatre
 * suivants sont arrivés avec la place de marché, où l'on distingue ce qui
 * avance (bleu), ce qui attend (or), ce qui va bien (olive) et ce qui alerte
 * (grenat). Une seule échelle pour les deux produits, plutôt qu'un second
 * composant qui dirait la même chose autrement.
 */
const STATUS_STYLE: Record<string, string> = {
  live: "bg-olive-wash text-olive-ink",
  draft: "bg-gold-wash text-gold-ink",
  suspended: "bg-coral-wash text-coral-deep",
  info: "bg-teal/12 text-teal-deep",
  waiting: "bg-coral-wash text-coral-deep",
  ok: "bg-olive-wash text-olive-ink",
  alert: "bg-gold-wash text-gold-ink",
  danger: "bg-[rgba(138,35,70,0.12)] text-[#8A2346]",
};

export function StatusTag({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${
        STATUS_STYLE[status] ?? "bg-line-soft text-ink/55"
      }`}
    >
      {label}
    </span>
  );
}

export function AdminEmpty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border-[1.5px] border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <div className="mb-1.5 font-display text-[19px] font-semibold">{title}</div>
      <p className="mx-auto mb-4 max-w-[420px] text-[14px] leading-relaxed text-ink/55">{text}</p>
      {action}
    </div>
  );
}
