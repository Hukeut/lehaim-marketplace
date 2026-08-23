import { redirect } from "next/navigation";
import { AdminEmpty, AdminTitle, Kpi, KpiGrid, StatusTag } from "@/components/admin";
import { requireBackOffice } from "@/lib/admin";
import { readJournal, updateKind, updateTitle } from "@/lib/updates";

/**
 * B8 · Mises à jour.
 *
 * Ce qui a changé dans l'app, et quand c'est arrivé en ligne. La source est
 * l'historique git figé pendant la construction : le journal décrit donc
 * exactement ce qui tourne, et pas ce qui traîne dans une branche.
 */

/** Chaque famille de changement prend la couleur du back-office qui lui va. */
const TONE: Record<string, string> = {
  fix: "suspended",
  db: "draft",
  feat: "live",
  change: "live",
};

const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const stamp = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminUpdates() {
  const role = await requireBackOffice();
  if (role !== "admin") redirect("/admin");

  const journal = readJournal();
  const latest = journal.days[0]?.updates[0];

  return (
    <>
      <AdminTitle
        title="Mises à jour"
        action={
          journal.branch && (
            <span className="rounded-full border-[1.5px] border-line bg-white px-4 py-2 font-mono text-[12px] font-bold shadow-[var(--shadow-pill)]">
              {journal.branch}
            </span>
          )
        }
      />

      <KpiGrid>
        <Kpi label="En ligne depuis" value={stamp.format(new Date(journal.builtAt))} />
        <Kpi
          label="Version en ligne"
          value={latest?.sha ?? "—"}
          hint={latest ? `par ${latest.author}` : undefined}
        />
        <Kpi label="Changements au journal" value={journal.total} />
        <Kpi label="Journées de travail" value={journal.days.length} />
      </KpiGrid>

      {journal.truncated && (
        <p className="mb-6 rounded-[18px] bg-gold-wash px-5 py-4 text-[13px] leading-relaxed text-gold-ink">
          L&apos;historique n&apos;a pas pu être lu en entier au moment de la construction.
          C&apos;est presque toujours un clone à profondeur réduite : vérifier que
          l&apos;étape <span className="font-mono">actions/checkout</span> du déploiement
          demande bien <span className="font-mono">fetch-depth</span>.
        </p>
      )}

      {journal.days.length ? (
        <div className="flex flex-col gap-8">
          {journal.days.map((day) => (
            <section key={day.key}>
              <h2 className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.03em] text-ink/45 uppercase">
                {day.label}
              </h2>

              <div className="flex flex-col gap-2.5">
                {day.updates.map((update) => {
                  const kind = updateKind(update.subject);
                  const isLive = update.sha === latest?.sha;

                  return (
                    <article
                      key={update.sha}
                      className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2.5">
                        <StatusTag status={TONE[kind.key] ?? "neutral"} label={kind.label} />
                        {isLive && <StatusTag status="live" label="Version en ligne" />}
                        <span className="ms-auto font-mono text-[11.5px] text-ink/40">
                          {update.sha} · {time.format(new Date(update.date))}
                        </span>
                      </div>

                      <h3 className="font-display text-[16.5px] leading-snug font-semibold">
                        {updateTitle(update.subject)}
                      </h3>

                      {update.body && (
                        <div className="mt-2.5 flex flex-col gap-2.5 border-t border-line-soft pt-2.5">
                          {update.body.split(/\n{2,}/).map((paragraph, index) => (
                            <p key={index} className="text-[13.5px] leading-relaxed text-ink/60">
                              {paragraph.replace(/\n/g, " ")}
                            </p>
                          ))}
                        </div>
                      )}

                      <p className="mt-2.5 text-[12px] font-bold text-ink/40">{update.author}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <AdminEmpty
          title="Aucune mise à jour au journal"
          text="Le journal se remplit à chaque construction du site, à partir de l'historique du dépôt."
        />
      )}

      <p className="mt-8 text-[13px] leading-relaxed text-ink/65">
        Ce journal est figé au moment où le site est construit : le changement en tête
        est celui qui tourne en ce moment. Git n&apos;enregistre pas les pushes eux-mêmes,
        seulement les changements — deux changements envoyés ensemble apparaissent donc
        comme deux entrées.
      </p>
    </>
  );
}
