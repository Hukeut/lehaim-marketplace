import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RoleIcon } from "@/components/RoleIcon";
import { formatDate, getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { ROLE_THEME, STAR_CLIP, roleNameSize } from "@/lib/role-theme";
import { asRoleKey } from "@/lib/templates";

/**
 * « Vous êtes le chef du chaud. »
 *
 * Le seul écran de récompense du produit : c'est ce moment qui donne envie de
 * reprendre un apport, et il ne se marquait par rien.
 *
 * Une seule mise en page, treize identités — la page entière prend la teinte
 * du rôle reçu (`lib/role-theme.ts`). D'où les styles en dur plutôt que des
 * classes : treize jeux de teintes arbitraires ne se pré-génèrent pas.
 *
 * On n'y arrive que par la prise. Quelqu'un qui tape l'adresse sans avoir la
 * mission est renvoyé sur sa fiche : féliciter pour un apport qu'on n'a pas
 * serait absurde.
 */
export default async function Role({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  const [t, tRoles, shabbat, ops] = await Promise.all([
    getTranslations("missions.role"),
    getTranslations("missions.roles"),
    getShabbat(id),
    getOps(id),
  ]);
  if (!shabbat || !ops) notFound();

  const mission = ops.missions.find((m) => m.id === mid);
  if (!mission) notFound();

  const mine = mission.claimers.find((c) => c.id === ops.meId) ?? null;
  if (!mine) redirect(`/shabbat/${id}/mission/${mid}`);

  const roleKey = asRoleKey(mine.roleKey);
  const theme = ROLE_THEME[roleKey];
  const name = tRoles(`${roleKey}.name`);

  // Ce qu'il reste à prendre : c'est l'invitation à recommencer, et elle n'a
  // de sens que s'il reste vraiment quelque chose.
  const left = ops.missions.filter((m) => !m.mine && m.free > 0).length;
  const taken = ops.missions.filter((m) => m.claimers.length > 0).length;

  return (
    <main
      className="relative flex min-h-dvh flex-1 flex-col overflow-hidden sm:min-h-0 sm:rounded-[28px]"
      style={{ background: theme.bg }}
    >
      {/* Deux cercles à peine détachés du fond : ils donnent de la profondeur
          sans rien ajouter à lire. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-[90px] -start-[60px] size-[320px] rounded-full"
        style={{ background: theme.deco }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -end-[80px] bottom-[230px] size-[240px] rounded-full"
        style={{ background: theme.deco }}
      />

      <header className="relative flex items-center justify-between px-6 pt-[26px]">
        <span className="text-[12.5px] font-extrabold" style={{ color: theme.fgMute }}>
          {t("shabbatOf", { date: formatDate(shabbat.startsAt) })}
        </span>
        <span className="flex items-center gap-2">
          <span
            className="font-display text-[12.5px] font-semibold"
            style={{ color: theme.fgMute }}
          >
            {taken} / {ops.missions.length}
          </span>
          <span
            aria-hidden="true"
            className="size-7 rounded-full"
            style={{ background: theme.chipBg }}
          />
        </span>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-7">
        <div className="animate-pop relative flex size-[232px] items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: theme.halo }}
          />
          {/* Le personnage déborde du disque plutôt que d'y flotter : ces
              illustrations sont des silhouettes entières, pieds compris, et
              contenues elles se lisaient comme une vignette. */}
          <span
            className="absolute size-[164px] rounded-full"
            style={{ background: theme.discBg }}
          />
          <RoleIcon role={roleKey} size={200} className="relative" />
          <span
            aria-hidden="true"
            className="absolute end-7 top-7 size-[20px]"
            style={{ background: theme.star, clipPath: STAR_CLIP }}
          />
          <span
            aria-hidden="true"
            className="absolute start-9 bottom-8 size-[15px]"
            style={{ background: theme.starSmall, clipPath: STAR_CLIP }}
          />
        </div>

        <span
          className="text-[13px] font-extrabold tracking-[0.14em] uppercase"
          style={{ color: theme.fgMute }}
        >
          {t("overline")}
        </span>

        <h1
          className="text-center font-display font-semibold"
          style={{ color: theme.fg, ...roleNameSize(name) }}
        >
          {name}
        </h1>

        <p
          className="max-w-[268px] text-center text-[15px] leading-[22px]"
          style={{ color: theme.fgSoft }}
        >
          {tRoles(`${roleKey}.tagline`)}
        </p>

        <span
          className="flex items-center gap-2 rounded-full px-4 py-2.5"
          style={{ background: theme.chipBg }}
        >
          <span className="text-[15px] leading-none">{mission.emoji}</span>
          <span className="text-[12.5px] font-extrabold" style={{ color: theme.fg }}>
            {mission.title}
          </span>
        </span>

        {/* Quand tout est pris, la table est complète — et c'est une meilleure
            nouvelle que « il ne reste rien à prendre ». */}
        {left === 0 && (
          <span
            className="flex items-center gap-2.5 rounded-card px-4 py-3"
            style={{ background: theme.chipBg }}
          >
            <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-olive" />
            <span className="text-[12.5px] font-extrabold" style={{ color: theme.fg }}>
              {t("tableComplete")}
            </span>
          </span>
        )}
      </div>

      {/* Le pied revient au fond crème : les actions appartiennent à l'app,
          pas au rôle. */}
      <div className="relative flex flex-col gap-2.5 rounded-t-sheet bg-cream px-5 pt-5.5 pb-5">
        <Link
          href={`/shabbat/${id}/mission/${mid}`}
          className="rounded-full bg-coral-deep py-[15px] text-center font-display text-[15px] font-semibold text-white shadow-[var(--shadow-coral)]"
        >
          {t("seeMission")}
        </Link>
        {left > 0 && (
          <Link
            href={`/shabbat/${id}/missions`}
            className="rounded-full border-2 border-teal py-[13px] text-center font-display text-[14.5px] font-semibold text-teal"
          >
            {t("takeAnother", { count: left })}
          </Link>
        )}
        <Link
          href="/accueil"
          className="py-1.5 text-center text-[13px] font-extrabold text-ink/50"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
