import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Check, MapPin } from "./icons";
import { LehaimIcon } from "./LehaimIcon";
import { MapLinks } from "./MapLinks";
import { Avatar } from "./ui";
import { countdown, formatDate, formatTime, type ShabbatDetail } from "@/lib/data";
import { dishImage } from "@/lib/dishes";
import type { Mission } from "@/lib/missions";
import { iconForMission } from "@/lib/mission-icons";

/**
 * La carte du prochain Shabbat, vue par un invité.
 *
 * Même forme que celle de l'organisateur, autre contenu : ni jauge de
 * préparation, ni compteurs de gestion, ni boutons « Gérer » et « Inviter ».
 * À la place, ce dont on a besoin quand on est attendu quelque part :
 * l'adresse et de quoi y aller, ce qu'on a promis d'apporter, et l'action
 * qui reste à faire.
 */
export async function GuestShabbatCard({
  shabbat,
  missions,
}: {
  shabbat: ShabbatDetail;
  missions: Mission[];
}) {
  const t = await getTranslations("shabbat.guestHome");
  const mine = missions.filter((m) => m.mine);
  const address = shabbat.address ?? shabbat.neighbourhood;

  return (
    <section className="relative mb-3.5 overflow-hidden rounded-hero bg-ink p-[18px] text-white">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.05em] text-teal-soft uppercase">
            {countdown(shabbat.startsAt)}
          </div>
          <h2 className="truncate font-display text-[21px] font-semibold">{shabbat.title}</h2>
          <div className="mt-0.5 text-[13.5px] text-white/60">
            {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
          </div>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold ${
            mine.length ? "bg-olive/20 text-olive" : "bg-white/10 text-gold"
          }`}
          aria-label={t("myContributionsCount", { count: mine.length })}
        >
          {mine.length ? <Check size={16} strokeWidth={3} /> : mine.length}
        </span>
      </div>

      <div className="mb-3.5 flex items-center gap-2.5 border-y border-white/12 py-3">
        <Avatar initial={shabbat.host.initial} tone={shabbat.host.tone} size={30} />
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
          {t("hostedBy", { host: shabbat.host.name })}
        </span>
      </div>

      {address && (
        <>
          <div className="mb-2.5 flex items-center gap-2.5">
            <MapPin size={14} className="shrink-0 text-teal-soft" />
            <span className="min-w-0 flex-1 text-[13.5px] text-white/75">{address}</span>
          </div>
          <MapLinks address={address} className="mb-4" />
        </>
      )}

      {mine.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {mine.map((mission) => {
            const claim = mission.claimers.find((c) => c.dishLabel);
            const dishKey = claim?.dishKeys[0] ?? null;
            return (
              <li
                key={mission.id}
                className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2.5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                  {dishKey ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={dishImage(dishKey)} alt="" className="size-full object-cover" />
                  ) : (
                    <LehaimIcon name={iconForMission(mission.title)} size={26} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{mission.title}</span>
                  {claim?.dishLabel && (
                    <span className="block truncate text-[12px] text-white/55">
                      {claim.dishLabel}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={`/shabbat/${shabbat.id}/missions`}
        className="flex w-full items-center justify-center rounded-full bg-coral py-3 font-display text-[14.5px] font-semibold text-white shadow-[var(--shadow-coral)]"
      >
        {mine.length ? t("editContributions") : t("chooseContribution")}
      </Link>
    </section>
  );
}

/** Chaque service garde sa couleur : on les reconnaît avant de les lire. */
