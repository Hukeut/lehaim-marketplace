import { Card, TopBar } from "@/components/ui";
import { myPaymentMethods } from "@/lib/payment-methods";
import { addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from "./actions";

/** Le portefeuille — cartes mémorisées via Grow, pour payer en un clic aux prochaines commandes. */
export default async function Paiement({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  const [{ added, error }, cards] = await Promise.all([searchParams, myPaymentMethods()]);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title="Moyens de paiement" back="/reglages" />

      <div className="flex-1 overflow-y-auto px-[18px] pt-3 pb-5">
        {added === "1" && (
          <p className="mb-3 rounded-card bg-teal/10 px-4 py-3 text-[13px] font-bold text-teal-deep">
            Carte enregistrée.
          </p>
        )}
        {error === "1" && (
          <p className="mb-3 rounded-card bg-coral-wash px-4 py-3 text-[13px] font-bold text-coral-deep">
            L&apos;ajout de la carte a échoué. Réessayez dans un instant.
          </p>
        )}

        {cards.length === 0 ? (
          <p className="mb-3 text-[13px] leading-relaxed text-ink/55">
            Aucune carte enregistrée pour l&apos;instant. Ajoutez-en une pour payer en un clic à votre
            prochaine commande.
          </p>
        ) : (
          <Card className="mb-3 flex flex-col">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`flex items-center justify-between gap-3 px-3.5 py-3.5 ${
                  index < cards.length - 1 ? "border-b border-line-soft" : ""
                }`}
              >
                <div>
                  <div className="text-[13px] font-bold">
                    {card.cardBrand ?? "Carte"} •••• {card.cardSuffix ?? "????"}
                  </div>
                  {card.cardExp && <div className="text-[11.5px] text-ink/45">Expire {card.cardExp}</div>}
                  {card.isDefault && (
                    <div className="mt-0.5 text-[11px] font-bold text-teal-deep">Par défaut</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!card.isDefault && (
                    <form action={setDefaultPaymentMethod}>
                      <input type="hidden" name="id" value={card.id} />
                      <button type="submit" className="text-[11.5px] font-bold text-teal-deep">
                        Définir par défaut
                      </button>
                    </form>
                  )}
                  <form action={deletePaymentMethod}>
                    <input type="hidden" name="id" value={card.id} />
                    <button type="submit" className="text-[11.5px] font-bold text-coral-deep">
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </Card>
        )}

        <form action={addPaymentMethod}>
          <button
            type="submit"
            className="w-full rounded-full border-2 border-line-soft py-3 text-[13.5px] font-bold text-ink/60"
          >
            Ajouter une carte
          </button>
        </form>

        <p className="mt-3 text-[11.5px] leading-relaxed text-ink/45">
          Supprimer une carte ici l&apos;efface de votre compte Lehaim ; elle n&apos;est alors plus
          utilisable pour vos commandes.
        </p>
      </div>
    </main>
  );
}
