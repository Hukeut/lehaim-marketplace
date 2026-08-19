import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { InfoNote } from "@/components/missions";
import { ExpenseForm, ContributionForm } from "./Forms";
import { Avatar, ButtonLink, Card, Overline, ProgressBar } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { FUNDING_LABEL, getOps } from "@/lib/missions";
import { createClient } from "@/lib/supabase/server";

/** S15 · Dépenses — quatre visages selon le mode de financement. */
export default async function Depenses({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const supabase = await createClient();
  const { data: contributionRows } = await supabase
    .from("contributions")
    .select("amount, profiles:profile_id(id, first_name, last_name)")
    .eq("shabbat_id", id);

  const total = shabbat.counts.spent;
  const people = [
    { id: shabbat.host.id ?? "host", name: shabbat.host.name, initial: shabbat.host.initial, tone: shabbat.host.tone },
    ...shabbat.invitations
      .filter((i) => i.status === "confirmed")
      .map((i) => ({ id: i.id ?? i.invitationId, name: i.name, initial: i.initial, tone: i.tone })),
  ];
  const share = people.length ? total / people.length : 0;

  const paidBy = new Map<string, number>();
  for (const expense of shabbat.expenses) {
    const key = expense.paidBy?.id ?? "—";
    paidBy.set(key, (paidBy.get(key) ?? 0) + expense.amount);
  }

  const pot = (contributionRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-2">
          <BackButton fallback={`/shabbat/${id}`} />
        </div>
        <h1 className="font-display text-[19px] font-semibold">
          {ops.fundingMode === "pot"
            ? "Cagnotte commune"
            : ops.fundingMode === "host_pays"
              ? "L'hôte paie tout"
              : "Dépenses"}
        </h1>
        <p className="mb-3.5 text-xs text-ink/55">Mode {FUNDING_LABEL[ops.fundingMode]}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* S15d · mode libre */}
        {ops.fundingMode === "free" && (
          <div className="flex flex-col items-center gap-3.5 px-5 py-16 text-center">
            <span className="flex size-[70px] items-center justify-center rounded-full bg-ink/6 text-[28px]">
              ✌️
            </span>
            <h2 className="font-display text-[19px] font-semibold">Mode libre activé</h2>
            <p className="max-w-[250px] text-[13px] leading-relaxed text-ink/60">
              Lehaim ne suit pas les dépenses pour ce Chabbat. Vous pouvez changer ce choix à tout
              moment.
            </p>
            <ButtonLink
              href={`/creer/${id}/financement`}
              variant="secondary"
              size="sm"
              full={false}
              className="mt-2"
            >
              Changer de mode
            </ButtonLink>
          </div>
        )}

        {/* S15b · cagnotte */}
        {ops.fundingMode === "pot" && (
          <>
            <div className="mb-4 rounded-panel bg-ink p-5 text-center text-white">
              <div className="mb-2 text-[10.5px] font-extrabold tracking-[0.04em] text-gold uppercase">
                Cagnotte disponible
              </div>
              <div className="mb-2.5 font-display text-3xl font-semibold">
                {Math.max(0, pot - total).toFixed(0)} €{" "}
                <span className="text-[15px] font-medium text-white/50">/ {pot.toFixed(0)} €</span>
              </div>
              <ProgressBar
                value={pot ? Math.min(100, ((pot - total) / pot) * 100) : 0}
                track="bg-white/15"
                height={10}
              />
            </div>
            <Overline>Déduit récemment</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {shabbat.expenses.map((expense) => (
                <Card as="li" key={expense.id} className="rounded-field">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <span className="flex-1 truncate text-[12.5px] font-bold">{expense.label}</span>
                    <span className="font-display text-[13px] font-semibold text-coral-deep">
                      −{expense.amount.toFixed(0)} €
                    </span>
                  </div>
                </Card>
              ))}
            </ul>
            <div className="mb-4">
              <InfoNote>
                Chaque achat déclaré est automatiquement déduit de la cagnotte commune.
              </InfoNote>
            </div>
            <ContributionForm shabbatId={id} />
          </>
        )}

        {/* S15 · partage des dépenses */}
        {ops.fundingMode === "split" && (
          <>
            <Card className="mb-4 rounded-[18px] p-4">
              <Overline>Total engagé</Overline>
              <div className="mb-2.5 font-display text-[26px] font-semibold">
                {total.toFixed(0)} €
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink/55">
                {people.map((person) => (
                  <span key={person.id}>
                    {person.name} · {(paidBy.get(person.id) ?? 0).toFixed(0)} €
                  </span>
                ))}
              </div>
            </Card>

            <Overline>Qui doit qui</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {people
                .map((person) => ({
                  person,
                  balance: (paidBy.get(person.id) ?? 0) - share,
                }))
                .filter((row) => row.balance < -0.5)
                .map(({ person, balance }) => (
                  <Card as="li" key={person.id} className="rounded-field">
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      <Avatar initial={person.initial} tone={person.tone} size={28} />
                      <span className="flex-1 text-[12.5px] font-bold">
                        {person.name} doit au groupe
                      </span>
                      <span className="font-display text-sm font-semibold text-coral-deep">
                        {Math.abs(balance).toFixed(0)} €
                      </span>
                    </div>
                  </Card>
                ))}
              {total === 0 && (
                <p className="text-[12px] text-ink/45">Aucune dépense déclarée pour l&apos;instant.</p>
              )}
            </ul>

            <Overline>Historique</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {shabbat.expenses.map((expense) => (
                <Card as="li" key={expense.id} className="rounded-field">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-bold">{expense.label}</div>
                      <div className="text-[10.5px] text-ink/50">{expense.paidBy?.name ?? "—"}</div>
                    </div>
                    <span className="font-display text-[13px] font-semibold">
                      {expense.amount.toFixed(0)} €
                    </span>
                  </div>
                </Card>
              ))}
            </ul>
            <ExpenseForm shabbatId={id} />
          </>
        )}

        {/* S15c · l'hôte paie */}
        {ops.fundingMode === "host_pays" && (
          <>
            <Card className="mb-4 rounded-[18px] p-4">
              <Overline>Avancé par l&apos;hôte</Overline>
              <div className="font-display text-[26px] font-semibold">{total.toFixed(0)} €</div>
            </Card>
            <Overline>Chacun devra</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {people.slice(1).map((person) => (
                <Card as="li" key={person.id} className="rounded-field">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <Avatar initial={person.initial} tone={person.tone} size={28} />
                    <span className="flex-1 truncate text-[12.5px] font-bold">{person.name}</span>
                    <span className="font-display text-sm font-semibold">
                      {share.toFixed(0)} €
                    </span>
                  </div>
                </Card>
              ))}
            </ul>
            <ExpenseForm shabbatId={id} />
          </>
        )}

        {/* byo · chacun apporte le sien */}
        {ops.fundingMode === "byo" && (
          <>
            <div className="mb-4">
              <InfoNote>
                Chacun achète ce qu&apos;il a choisi : Lehaim ne calcule aucun remboursement. Les
                montants ci-dessous servent seulement à suivre le budget.
              </InfoNote>
            </div>
            <Card className="mb-4 rounded-[18px] p-4">
              <Overline>Total déclaré</Overline>
              <div className="font-display text-[26px] font-semibold">
                {total.toFixed(0)} €
                {shabbat.budgetPlanned ? (
                  <span className="text-[15px] font-medium text-ink/40">
                    {" "}
                    / {shabbat.budgetPlanned.toFixed(0)} €
                  </span>
                ) : null}
              </div>
            </Card>
            <ExpenseForm shabbatId={id} />
          </>
        )}

        {ops.fundingMode !== "free" && (
          <Link
            href={`/creer/${id}/financement`}
            className="mt-4 block text-center text-[12px] font-bold text-teal"
          >
            Changer de mode de financement
          </Link>
        )}
      </div>
    </main>
  );
}
