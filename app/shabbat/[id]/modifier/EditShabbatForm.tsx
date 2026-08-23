"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateShabbat, type ActionState } from "@/app/actions";
import { Calendar, Clock, MapPin } from "@/components/icons";
import { Button, Field, StickyFooter } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[14.5px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function EditShabbatForm({
  shabbat,
}: {
  shabbat: {
    id: string;
    title: string;
    date: string;
    time: string;
    address: string;
    neighbourhood: string;
  };
}) {
  const t = useTranslations("shabbat.create");
  const te = useTranslations("shabbat.edit");
  const [state, formAction, pending] = useActionState(updateShabbat, initial);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="shabbat_id" value={shabbat.id} />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
        <Field label={t("titleLabel")}>
          <input name="title" defaultValue={shabbat.title} className={inputClass} />
        </Field>

        <div className="flex gap-2.5">
          <Field label={t("dateLabel")} className="flex-1">
            <div className="flex items-center gap-2 rounded-field bg-white px-3 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
              <Calendar size={15} className="shrink-0 text-teal" />
              <input
                type="date"
                name="date"
                required
                defaultValue={shabbat.date}
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
                defaultValue={shabbat.time}
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
              defaultValue={shabbat.address}
              placeholder={t("addressPlaceholder")}
              className="w-full bg-transparent text-[14.5px] outline-none"
            />
          </div>
        </Field>

        <Field label={t("neighbourhoodLabel")}>
          <input
            name="neighbourhood"
            defaultValue={shabbat.neighbourhood}
            placeholder={t("neighbourhoodPlaceholder")}
            className={inputClass}
          />
        </Field>

        {state.message && (
          <p
            role="alert"
            className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[13.5px] font-bold text-coral-deep"
          >
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-5">
        <Button type="submit" size="lg" disabled={pending}>
          {te("save")}
        </Button>
      </StickyFooter>
    </form>
  );
}
