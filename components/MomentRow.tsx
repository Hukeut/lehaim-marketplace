"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setMomentDetail, toggleMoment } from "@/app/mission-actions";
import type { Moment } from "@/lib/missions";
import { LehaimIcon, type LehaimIconName } from "./LehaimIcon";
import { Card } from "./ui";

const TONE = {
  gold: "bg-gold/28",
  coral: "bg-coral/14",
  violet: "bg-violet/14",
} as const;

/**
 * Une ligne de moment : interrupteur, et pour un moment actif, son heure
 * saisie sur la ligne même. Le couchage montre en plus son détail, toujours
 * ouvert : il a de toute façon quelque chose à renseigner. Chaque choix
 * s'enregistre seul, il n'y a pas de bouton.
 */
export function MomentRow({
  shabbatId,
  kind,
  label,
  detail,
  icon,
  tone,
  moment,
  locked = false,
}: {
  shabbatId: string;
  kind: string;
  label: string;
  detail: string;
  icon: LehaimIconName;
  tone: keyof typeof TONE;
  moment: Moment | null;
  /** Décidé à l'étape précédente : on montre l'heure, pas l'interrupteur. */
  locked?: boolean;
}) {
  const t = useTranslations("shabbat.create.moments.detail");
  const [pending, startTransition] = useTransition();

  const enabled = Boolean(moment);
  const sleeping = kind === "sleepover";

  // L'état affiché suit le choix immédiatement : la ligne ne doit pas
  // attendre l'aller-retour serveur pour montrer la nouvelle valeur.
  const [meetAt, setMeetAt] = useState(moment?.meetAt ?? null);
  const [capacity, setCapacity] = useState(moment?.capacity ?? 0);
  const [policy, setPolicy] = useState(moment?.sleepingPolicy ?? "mixed");
  const synagogue = kind.startsWith("synagogue");
  const [place, setPlace] = useState(moment?.detail ?? "");

  function save(next: {
    meetAt?: string | null;
    capacity?: number;
    policy?: "mixed" | "girls" | "boys";
    place?: string;
  }) {
    if (!moment) return;
    const payload = {
      meetAt: next.meetAt !== undefined ? next.meetAt : meetAt,
      capacity: next.capacity !== undefined ? next.capacity : capacity,
      sleepingPolicy: sleeping ? (next.policy ?? policy) : null,
      ...(synagogue ? { place: (next.place ?? place).trim() || null } : {}),
    };
    startTransition(() => setMomentDetail(shabbatId, moment.id, payload));
  }

  const subtitle =
    synagogue && enabled && place.trim()
      ? place.trim()
      : sleeping && enabled && capacity > 0
      ? `${t("places", { count: capacity })} · ${t(`policies.${policy}`)}`
      : detail;

  return (
    <Card className={`overflow-hidden ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2.5 px-3 py-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            enabled ? TONE[tone] : "bg-line/60 grayscale"
          }`}
        >
          <LehaimIcon name={icon} size={34} />
        </span>

        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[14.5px] font-bold ${enabled ? "" : "text-ink/55"}`}>
            {label}
          </span>
          <span className={`block truncate text-[12px] ${enabled ? "text-ink/65" : "text-ink/40"}`}>
            {subtitle}
          </span>
        </span>

        {enabled && (
          <label className="shrink-0">
            <span className="sr-only">{sleeping ? t("arrivalAt") : t("meetAt")}</span>
            <input
              type="time"
              value={meetAt ?? ""}
              onChange={(e) => {
                const value = e.target.value || null;
                setMeetAt(value);
                save({ meetAt: value });
              }}
              className="w-[74px] rounded-lg bg-line-soft px-2 py-1.5 text-center text-[14px] font-bold text-teal-deep"
            />
          </label>
        )}

        {!locked && (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            onClick={() => startTransition(() => toggleMoment(shabbatId, kind, enabled))}
            className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${enabled ? "bg-teal" : "bg-line"}`}
          >
            <span
              className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-all ${enabled ? "start-[19px]" : "start-[3px]"}`}
            />
          </button>
        )}
      </div>

      {enabled && synagogue && (
        <div className="ps-[58px] pe-3 pb-3.5">
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            onBlur={(e) => save({ place: e.target.value })}
            placeholder={t("synagoguePlaceholder")}
            className="w-full rounded-xl border-[1.5px] border-line bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-teal/40"
          />
        </div>
      )}

      {enabled && sleeping && (
        <div className="flex flex-col gap-3 ps-[58px] pe-3 pb-3.5">
          <Group label={t("capacity")}>
            <div className="flex items-center gap-3">
              <Step
                label="–"
                onClick={() => {
                  const next = Math.max(0, capacity - 1);
                  setCapacity(next);
                  save({ capacity: next });
                }}
              />
              <span className="min-w-4 text-center font-display text-base font-semibold">
                {capacity}
              </span>
              <Step
                accent
                label="+"
                onClick={() => {
                  const next = Math.min(60, capacity + 1);
                  setCapacity(next);
                  save({ capacity: next });
                }}
              />
            </div>
          </Group>

          <Group label={t("policy")}>
            <div className="flex flex-1 gap-1.5">
              {(["mixed", "girls", "boys"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setPolicy(value);
                    save({ policy: value });
                  }}
                  className={`flex-1 rounded-full py-2 text-[14px] font-bold ${
                    policy === value ? "bg-ink text-white" : "bg-line-soft text-ink/55"
                  }`}
                >
                  {t(`policies.${value}`)}
                </button>
              ))}
            </div>
          </Group>

          <Link
            href={`/shabbat/${shabbatId}/couchage`}
            className="text-[14px] font-bold text-teal"
          >
            {t("manageRooms")}
          </Link>
        </div>
      )}
    </Card>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-[7px] text-[11.5px] font-extrabold tracking-[0.04em] text-ink/40 uppercase">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Step({
  label,
  accent,
  onClick,
}: {
  label: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex size-[30px] items-center justify-center rounded-[9px] text-base font-bold ${
        accent ? "bg-teal text-white" : "bg-line-soft text-ink"
      }`}
    >
      {label}
    </button>
  );
}
