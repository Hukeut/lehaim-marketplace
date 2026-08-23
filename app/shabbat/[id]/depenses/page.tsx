import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { InfoNote } from "@/components/missions";
import { ExpenseForm, ContributionForm } from "./Forms";
import { Avatar, ButtonLink, Card, Overline, ProgressBar } from "@/components/ui";
import { requireManager } from "@/lib/access";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { createClient } from "@/lib/supabase/server";

/** S15 · Dépenses — quatre visages selon le mode de financement. */
export default async function Depenses({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("expenses");
  const tf = await getTranslations("expenses.fundingMode");
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
        <h1 className="font-display text-[21px] font-semibold">
          {ops.fundingMode === "pot"
            ? tf("pot.label")
            : ops.fundingMode === "host_pays"
              ? tf("host_pays.label")
              : t("title")}
        </h1>
        <p className="mb-3.5 text-xs text-ink/55">
          {t("modeLabel", { label: tf(`${ops.fundingMode}.label`) })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* S15d · mode libre */}
        {ops.fundingMode === "free" && (
          <div className="flex flex-col items-center gap-3.5 px-5 py-16 text-center">
            <span className="flex size-[70px] items-center justify-center rounded-full bg-ink/6 text-[28px]">
              ✌️
            </span>
            <h2 className="font-display text-[21px] font-semibold">{t("free.activatedTitle")}</h2>
            <p className="max-w-[250px] text-[14.5px] leading-relaxed text-ink/60">
              {t("free.description")}
            </p>
            <ButtonLink
              href={`/creer/${id}/financement`}
              variant="secondary"
              size="sm"
              full={false}
              className="mt-2"
            >
              {t("free.changeMode")}
            </ButtonLink>
          </div>
        )}

        {/* S15b · cagnotte */}
        {ops.fundingMode === "pot" && (
          <>
            <div className="mb-4 rounded-panel bg-ink p-5 text-center text-white">
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.04em] text-gold uppercase">
                {t("pot.available")}
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
            <Overline>{t("pot.recentlyDeducted")}</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {shabbat.expenses.map((expense) => (
                <Card as="li" key={expense.id} className="rounded-field">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <span className="flex-1 truncate text-[14px] font-bold">{expense.label}</span>
                    <span className="font-display text-[14.5px] font-semibold text-coral-deep">
                      −{expense.amount.toFixed(0)} €
                    </span>
                  </div>
                </Card>
              ))}
            </ul>
            <div className="mb-4">
              <InfoNote>{t("pot.autoDeductNote")}</InfoNote>
            </div>
            <ContributionForm shabbatId={id} />
          </>
        )}

        {/* S15 · partage des dépenses */}
        {ops.fundingMode === "split" && (
          <>
            <Card className="mb-4 rounded-[18px] p-4">
              <Overline>{t("split.totalCommitted")}</Overline>
              <div className="mb-2.5 font-display text-[26px] font-semibold">
                {total.toFixed(0)} €
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink/55">
                {people.map((person) => (
                  <span key={person.id}>
                    {person.name} · {(paidBy.get(person.id) ?? 0).toFixed(0)} €
                  </span>
                ))}
              </div>
            </Card>

            <Overline>{t("split.whoOwesWhom")}</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {people
                .map((person) => ({
                  person,
                  balance: (paidBy.get(person.id) ?? 0) - share,
                }))
                // i18n-ignore : "=>" (flèche) puis "<" (comparaison numérique) — aucune balise JSX ici.
                .filter((row) => row.balance < -0.5)
                .map(({ person, balance }) => (
                  <Card as="li" key={person.id} className="rounded-field">
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      <Avatar initial={person.initial} tone={person.tone} size={28} />
                      <span className="flex-1 text-[14px] font-bold">
                        {t("split.owesGroup", { name: person.name })}
                      </span>
                      <span className="font-display text-sm font-semibold text-coral-deep">
                        {Math.abs(balance).toFixed(0)} €
                      </span>
                    </div>
                  </Card>
                ))}
              {total === 0 && (
                <p className="text-[13.5px] text-ink/45">{t("split.noExpensesYet")}</p>
              )}
            </ul>

            <Overline>{t("split.history")}</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {shabbat.expenses.map((expense) => (
                <Card as="li" key={expense.id} className="rounded-field">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold">{expense.label}</div>
                      <div className="text-[12px] text-ink/65">{expense.paidBy?.name ?? "—"}</div>
                    </div>
                    <span className="font-display text-[14.5px] font-semibold">
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
              <Overline>{t("hostPays.advancedByHost")}</Overline>
              <div className="font-display text-[26px] font-semibold">{total.toFixed(0)} €</div>
            </Card>
            <Overline>{t("hostPays.eachWillOwe")}</Overline>
            <ul className="mb-4 flex flex-col gap-2">
              {people.slice(1).map((person) => (
                <Card as="li" key={person.id} className="rounded-field">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <Avatar initial={person.initial} tone={person.tone} size={28} />
                    <span className="flex-1 truncate text-[14px] font-bold">{person.name}</span>
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
              <InfoNote>{t("byo.infoNote")}</InfoNote>
            </div>
            <Card className="mb-4 rounded-[18px] p-4">
              <Overline>{t("byo.totalDeclared")}</Overline>
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
            className="mt-4 block text-center text-[13.5px] font-bold text-teal"
          >
            {t("changeFundingMode")}
          </Link>
        )}
      </div>
    </main>
  );
}
