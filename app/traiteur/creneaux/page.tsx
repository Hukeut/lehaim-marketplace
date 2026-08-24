import { AdminTitle, StatusTag } from "@/components/admin";
import { mySlots, requireMyShop } from "@/lib/merchant";
import { addSlot, removeSlot } from "./actions";

/**
 * Les créneaux à venir.
 *
 * Groupés par jour, parce que c'est comme ça qu'on raisonne un service.
 *
 * Porté depuis Rraven666/lehaim avec un écart volontaire : là où l'écran
 * d'origine génère des créneaux depuis une grille d'horaires, le backend
 * traiteur ne connaît que des créneaux ajoutés à la main (date + libellé).
 * La capacité, elle, est bien branchée : un nombre optionnel par créneau,
 * comparé aux commandes actives qui le tiennent (voir createOrder).
 */

const dayLabel = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function Creneaux() {
  const shop = await requireMyShop();
  const slots = await mySlots(shop.id);

  const byDay = new Map<string, typeof slots>();
  for (const slot of slots) {
    byDay.set(slot.date, [...(byDay.get(slot.date) ?? []), slot]);
  }

  return (
    <>
      <AdminTitle
        title="Créneaux"
        action={<StatusTag status={slots.length > 0 ? "ok" : "draft"} label={`${slots.length} à venir`} />}
      />

      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
        <form action={addSlot} className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Date</span>
            <input
              name="date"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              className="rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-2.5 text-[13.5px] font-bold outline-none focus:border-teal"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Créneau</span>
            <input
              name="label"
              type="text"
              required
              placeholder="12h–13h"
              className="w-32 rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-2.5 text-[13.5px] font-bold outline-none focus:border-teal"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Places (optionnel)</span>
            <input
              name="capacity"
              type="number"
              min={1}
              placeholder="Illimité"
              className="w-28 rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-2.5 text-[13.5px] font-bold outline-none focus:border-teal"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-teal px-5 py-2.5 font-display text-[13.5px] font-semibold text-white"
          >
            Ajouter
          </button>
        </form>

        <p className="min-w-[24ch] flex-1 text-[12px] leading-snug text-ink/50">
          Un créneau est une date et un libellé libre (« 12h–13h », « avant Chabbat »…). Vos
          clients ne choisissent que parmi ceux que vous ouvrez ici.
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-line bg-white/60 px-6 py-12 text-center">
          <div className="mb-1.5 font-display text-[17px] font-semibold">Aucun créneau ouvert</div>
          <p className="mx-auto max-w-[48ch] text-[13.5px] leading-relaxed text-ink/55">
            Sans créneau, vos clients ne peuvent pas choisir d&apos;heure de retrait. Ajoutez-en au
            moins un pour les prochains jours.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...byDay.entries()].map(([day, list]) => (
            <section key={day} className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 font-display text-[15.5px] font-semibold first-letter:uppercase">
                {dayLabel.format(new Date(`${day}T12:00:00`))}
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((slot) => {
                  const full = slot.capacity !== null && slot.booked >= slot.capacity;
                  return (
                    <form key={slot.id} action={removeSlot}>
                      <input type="hidden" name="id" value={slot.id} />
                      <button
                        type="submit"
                        title="Retirer ce créneau"
                        className={`flex flex-col items-start gap-0.5 rounded-[14px] border-[1.5px] px-3.5 py-2 text-start ${
                          full ? "border-coral-deep bg-coral-wash" : "border-line bg-white"
                        }`}
                      >
                        <span className="text-[13px] font-bold">{slot.label}</span>
                        {slot.capacity !== null && (
                          <span
                            className={`text-[11px] font-bold ${full ? "text-coral-deep" : "text-ink/45"}`}
                          >
                            {slot.booked}/{slot.capacity} places {full && "· complet"}
                          </span>
                        )}
                      </button>
                    </form>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
