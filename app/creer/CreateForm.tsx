"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createShabbat, type ActionState } from "@/app/actions";
import { Calendar, Clock, MapPin } from "@/components/icons";
import { StepDots } from "@/components/StepDots";
import { Button, Field, StickyFooter } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[14.5px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

/** Prochain vendredi, proposé par défaut. */
function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateForm({ canCreate }: { canCreate: boolean }) {
  const t = useTranslations("shabbat.create");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState(createShabbat, initial);
  const [guests, setGuests] = useState(8);
  const [date, setDate] = useState(nextFriday());
  // 6 = samedi. Le jour choisi détermine quel moment on propose en plus.
  const isSaturday = new Date(`${date}T12:00`).getDay() === 6;
  const [alsoOther, setAlsoOther] = useState(true);
  const [visibility, setVisibility] = useState<"invite" | "link">("invite");

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="guest_target" value={guests} />
      <input type="hidden" name="also_other_day" value={alsoOther ? "1" : "0"} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <StepDots current={1} total={5} />
        <h1 className="mb-4.5 font-display text-[18px] leading-tight font-semibold">{t("title")}</h1>

        <div className="flex flex-col gap-3">
          <Field label={t("titleLabel")}>
            <input name="title" defaultValue={t("titleDefault")} className={inputClass} />
          </Field>

          <div className="flex gap-2.5">
            <Field label={t("dateLabel")} className="flex-1">
              <div className="flex items-center gap-2 rounded-field bg-white px-3 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
                <Calendar size={15} className="shrink-0 text-teal" />
                <input
                  type="date"
                  name="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-bold outline-none"
                />
              </div>
            </Field>
            <Field label={t("timeLabel")} className="flex-1">
              <div className="flex items-center gap-2 rounded-field bg-white px-3 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
                <Clock size={15} className="shrink-0 text-teal" />
                <input
                  type="time"
                  name="time"
                  defaultValue="19:30"
                  className="w-full bg-transparent text-[14px] font-bold outline-none"
                />
              </div>
            </Field>
          </div>

          <Field label={t("addressLabel")}>
            <div className="flex items-center gap-2.5 rounded-field bg-white px-4 py-3.5 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
              <MapPin size={16} className="shrink-0 text-coral" />
              <input
                name="address"
                placeholder={t("addressPlaceholder")}
                className="w-full bg-transparent text-[14.5px] outline-none"
              />
            </div>
          </Field>

          <Field label={t("neighbourhoodLabel")}>
            <input name="neighbourhood" placeholder={t("neighbourhoodPlaceholder")} className={inputClass} />
          </Field>

          <button
            type="button"
            onClick={() => setAlsoOther((value) => !value)}
            className="flex items-center gap-3 rounded-field bg-white px-4 py-3.5 text-start shadow-[var(--shadow-card)]"
          >
            <span
              className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors ${alsoOther ? "bg-teal" : "bg-line"}`}
            >
              <span
                className={`absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-all ${alsoOther ? "start-[21px]" : "start-[3px]"}`}
              />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-bold">
                {isSaturday ? t("alsoFriday") : t("alsoSaturday")}
              </span>
              <span className="block text-[12.5px] text-ink/55">{t("alsoHint")}</span>
            </span>
          </button>

          <Field label={t("guestCountLabel")}>
            <div className="flex items-center justify-between rounded-field bg-white px-4 py-2.5 shadow-[var(--shadow-card)]">
              <button
                type="button"
                aria-label={t("removeGuestAria")}
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="flex size-[30px] items-center justify-center rounded-full bg-line-soft text-base font-bold text-ink"
              >
                –
              </button>
              <span className="font-display text-base font-semibold">{guests}</span>
              <button
                type="button"
                aria-label={t("addGuestAria")}
                onClick={() => setGuests((g) => Math.min(60, g + 1))}
                className="flex size-[30px] items-center justify-center rounded-full bg-teal text-base font-bold text-white"
              >
                +
              </button>
            </div>
          </Field>

          <Field label={t("visibilityLabel")}>
            <div className="flex gap-2">
              {(["invite", "link"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`flex-1 rounded-full py-2.5 text-[14px] font-bold transition-colors ${
                    visibility === value
                      ? "bg-ink text-white"
                      : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                  }`}
                >
                  {value === "invite" ? t("visibilityInvite") : t("visibilityLink")}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">
              {visibility === "invite" ? t("visibilityInviteHint") : t("visibilityLinkHint")}
            </p>
          </Field>
        </div>

        {state.message && (
          <p
            role="alert"
            className="mt-4 rounded-field bg-coral-wash px-3.5 py-2.5 text-[13.5px] font-bold text-coral-deep"
          >
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-5">
        <Button
          type="submit"
          size="lg"
          disabled={!canCreate || pending}
          className="shadow-[var(--shadow-coral-lg)]"
        >
          {pending ? t("creating") : canCreate ? tc("continue") : t("loginToCreate")}
        </Button>
      </StickyFooter>
    </form>
  );
}
