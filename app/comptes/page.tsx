import { cookies } from "next/headers";
import { Card, TopBar } from "@/components/ui";
import { currentUser } from "@/lib/supabase/user";
import { ACCOUNTS_COOKIE, parseAccounts } from "@/lib/accounts";
import { switchAccount, removeAccount, addAccount } from "./actions";

/**
 * Le sélecteur de comptes — voir lib/accounts.ts pour le pourquoi.
 *
 * Une session par navigateur normalement ; ici, une liste de comptes déjà
 * connectés sur cet appareil, entre lesquels on peut basculer sans se
 * reconnecter à chaque fois.
 */
export default async function Comptes({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ erreur }, store, user] = await Promise.all([searchParams, cookies(), currentUser()]);
  const accounts = parseAccounts(store.get(ACCOUNTS_COOKIE)?.value);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title="Comptes" back="/reglages" />

      <div className="flex-1 overflow-y-auto px-[18px] pt-3 pb-5">
        {erreur === "introuvable" && (
          <p className="mb-3 rounded-card bg-coral-wash px-4 py-3 text-[13px] font-bold text-coral-deep">
            Ce compte n&apos;est plus disponible. Reconnectez-vous.
          </p>
        )}

        {accounts.length === 0 ? (
          <p className="mb-3 text-[13px] leading-relaxed text-ink/55">
            Aucun compte enregistré sur cet appareil pour l&apos;instant.
          </p>
        ) : (
          <Card className="mb-3 flex flex-col">
            {accounts.map((account, index) => {
              const active = account.userId === user?.id;
              return (
                <div
                  key={account.userId}
                  className={`flex items-center justify-between gap-3 px-3.5 py-3.5 ${
                    index < accounts.length - 1 ? "border-b border-line-soft" : ""
                  }`}
                >
                  <div>
                    <div className="text-[13px] font-bold">{account.firstName ?? account.email}</div>
                    <div className="text-[11.5px] text-ink/45">{account.email}</div>
                    {active && <div className="mt-0.5 text-[11px] font-bold text-teal-deep">Compte actif</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!active && (
                      <form action={switchAccount}>
                        <input type="hidden" name="user_id" value={account.userId} />
                        <button type="submit" className="text-[11.5px] font-bold text-teal-deep">
                          Basculer
                        </button>
                      </form>
                    )}
                    <form action={removeAccount}>
                      <input type="hidden" name="user_id" value={account.userId} />
                      <button type="submit" className="text-[11.5px] font-bold text-coral-deep">
                        Retirer
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <form action={addAccount}>
          <button
            type="submit"
            className="w-full rounded-full border-2 border-line-soft py-3 text-[13.5px] font-bold text-ink/60"
          >
            Ajouter un compte
          </button>
        </form>

        <p className="mt-3 text-[11.5px] leading-relaxed text-ink/45">
          Basculer change le compte actif sur cet appareil, pour vous et pour quiconque l&apos;utilise. Retirer
          n&apos;efface que la liste locale — le compte lui-même n&apos;est pas supprimé.
        </p>
      </div>
    </main>
  );
}
