import { redirect } from "next/navigation";
import { AdminEmpty, AdminTitle, StatusTag } from "@/components/admin";
import { requireBackOffice } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { run } from "@/lib/db";
import { clearFeatured, setFeatured } from "./actions";

/**
 * Marketing — pour l'instant, la mise en avant.
 *
 * Un rang plutôt qu'un booléen : quand deux commerces sont mis en avant, il
 * faut décider lequel est premier, et un booléen laisserait ce choix à la
 * date de création — qui n'a aucun rapport.
 *
 * Les codes promo viendront à part. Ils touchent le calcul de la commande, et
 * demandent d'abord de trancher qui absorbe la remise : le commerce ou la
 * plateforme. Ce n'est pas une question d'écran.
 */
export default async function Marketing() {
  const role = await requireBackOffice();
  if (role !== "admin") redirect("/admin/service");

  const supabase = await createClient();
  const { data } = await run(
    "marketing/shops",
    supabase
      .from("shops")
      .select("id, name, slug, category, status, featured_rank, featured_note")
      .eq("status", "live")
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .order("name"),
  );

  const shops = ((data ?? []) as unknown as Record<string, unknown>[]).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    slug: s.slug as string,
    rank: (s.featured_rank as number) ?? null,
    note: (s.featured_note as string) ?? null,
  }));

  const featured = shops.filter((s) => s.rank !== null);
  const rest = shops.filter((s) => s.rank === null);

  return (
    <>
      <AdminTitle
        title="Marketing"
        action={<StatusTag status={featured.length > 0 ? "ok" : "draft"} label={`${featured.length} en avant`} />}
      />

      {shops.length === 0 ? (
        <AdminEmpty
          title="Aucune boutique en ligne"
          text="La mise en avant porte sur les commerces déjà validés. Approuvez un dossier pour pouvoir en mettre un en tête de vitrine."
        />
      ) : (
        <div className="flex flex-col gap-5">
          <section className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="mb-1 font-display text-[16px] font-semibold">En tête de vitrine</div>
            <p className="mb-3.5 text-[12px] leading-snug text-ink/50">
              Rang 1 en premier. Les autres commerces suivent par ordre alphabétique.
            </p>

            {featured.length === 0 ? (
              <p className="py-4 text-[13.5px] text-ink/55">Aucun commerce mis en avant.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {featured.map((shop) => (
                  <li
                    key={shop.id}
                    className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line-soft p-3.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal text-[13px] font-extrabold text-white">
                      {shop.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-[14.5px] font-semibold">{shop.name}</div>
                      {shop.note && <div className="text-[12px] text-ink/55">{shop.note}</div>}
                    </div>
                    <form action={clearFeatured} className="ms-auto">
                      <input type="hidden" name="id" value={shop.id} />
                      <button
                        type="submit"
                        className="rounded-full border-2 border-line px-4 py-2 text-[12.5px] font-bold text-ink/60"
                      >
                        Retirer
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3.5 font-display text-[16px] font-semibold">Les autres commerces</div>
            {rest.length === 0 ? (
              <p className="py-4 text-[13.5px] text-ink/55">Tous les commerces sont mis en avant.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {rest.map((shop) => (
                  <li key={shop.id}>
                    <form
                      action={setFeatured}
                      className="flex flex-wrap items-center gap-2.5 rounded-[14px] border border-line-soft p-3.5"
                    >
                      <input type="hidden" name="id" value={shop.id} />
                      <span className="min-w-0 flex-1 font-display text-[14.5px] font-semibold">
                        {shop.name}
                      </span>
                      <input
                        name="rank"
                        type="number"
                        min={1}
                        max={99}
                        placeholder="rang"
                        className="w-20 rounded-[12px] border-[1.5px] border-line bg-sand px-3 py-2 text-[13px] font-bold outline-none focus:border-teal"
                      />
                      <input
                        name="note"
                        placeholder="Accroche affichée, facultative"
                        className="min-w-[18ch] flex-1 rounded-[12px] border-[1.5px] border-line bg-sand px-3 py-2 text-[13px] outline-none focus:border-teal"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white"
                      >
                        Mettre en avant
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
