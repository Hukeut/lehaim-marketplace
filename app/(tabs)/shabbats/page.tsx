import Link from "next/link";
import { Plus } from "@/components/icons";
import { SegmentedTabs } from "@/components/interactive";
import { EmptyState, SignedOut } from "@/components/States";
import { Card, ProgressBar, ScreenBody, StatusPill } from "@/components/ui";
import {
  countdown,
  formatDate,
  formatTime,
  listHostedShabbats,
  listJoinedShabbats,
} from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";
import { BrandMark } from "@/components/BrandMark";

/** 17 · Mes Shabbats */
export default async function MesShabbats() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <ScreenBody>
        <BrandMark className="mb-3" />
        <h1 className="mb-4 font-display text-[19px] font-semibold">Mes Shabbats</h1>
        <SignedOut suite="/shabbats" what="vos Shabbats" />
      </ScreenBody>
    );
  }

  const [hosted, joined] = await Promise.all([listHostedShabbats(), listJoinedShabbats()]);

  return (
    <ScreenBody>
      <BrandMark className="mb-3" />
      <div className="mb-3.5 flex items-center justify-between">
        <h1 className="font-display text-[19px] font-semibold">Mes Shabbats</h1>
        <Link
          href="/creer"
          aria-label="Créer un Shabbat"
          className="flex size-[38px] items-center justify-center rounded-full bg-teal text-white shadow-[0_6px_14px_rgba(42,167,161,0.35)] active:scale-95"
        >
          <Plus size={17} />
        </Link>
      </div>

      <SegmentedTabs
        className="mb-4"
        tabs={["J'organise", "J'y participe"]}
        panels={[
          hosted.length ? (
            <ul key="h" className="flex flex-col gap-2.5">
              {hosted.map((s) => {
                const past = s.isPast;
                return (
                  <Card as="li" key={s.id} className={`rounded-[18px] p-3.5 ${past ? "opacity-70" : ""}`}>
                    <Link href={past ? `/shabbat/${s.id}/recap` : `/shabbat/${s.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-display text-sm font-semibold">
                            {s.title}
                          </div>
                          <div className="text-[11px] text-ink/50">
                            {formatDate(s.startsAt)} · {formatTime(s.startsAt)}
                          </div>
                        </div>
                        <StatusPill tone={past ? "neutral" : "info"}>
                          {past ? "Terminé" : countdown(s.startsAt)}
                        </StatusPill>
                      </div>
                      {!past && (
                        <div className="mt-2.5">
                          <ProgressBar value={0} />
                          <div className="mt-1.5 text-[10.5px] text-ink/50">
                            {s.guestTarget} places prévues
                          </div>
                        </div>
                      )}
                    </Link>
                  </Card>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              key="h"
              illustration="/illustrations/etat-vide-table.jpg"
              title="Aucun Shabbat prévu"
              text="Ouvrez votre table à vos proches : choisissez une date, on s'occupe du reste."
              cta="Créer un Shabbat"
              href="/creer"
            />
          ),
          joined.length ? (
            <ul key="j" className="flex flex-col gap-2.5">
              {joined.map((s) => (
                <Card as="li" key={s.id} className="rounded-[18px] p-3.5">
                  <Link
                    href={`/invitation/${s.id}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold">{s.title}</div>
                      <div className="text-[11px] text-ink/50">
                        {formatDate(s.startsAt)} · {formatTime(s.startsAt)}
                        {s.neighbourhood ? ` · ${s.neighbourhood}` : ""}
                      </div>
                      {s.myRole && (
                        <div className="mt-1 text-[10.5px] font-bold text-coral-deep">
                          {s.myRole}
                        </div>
                      )}
                    </div>
                    <StatusPill
                      tone={
                        s.myStatus === "confirmed"
                          ? "success"
                          : s.myStatus === "declined"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {s.myStatus === "confirmed"
                        ? "Confirmé"
                        : s.myStatus === "declined"
                          ? "Décliné"
                          : "À répondre"}
                    </StatusPill>
                  </Link>
                </Card>
              ))}
            </ul>
          ) : (
            <EmptyState
              key="j"
              illustration="/illustrations/choisir-un-shabbat.jpg"
              title="Aucune invitation"
              text="Quand un proche vous ouvrira sa table, elle apparaîtra ici."
            />
          ),
        ]}
      />
    </ScreenBody>
  );
}
