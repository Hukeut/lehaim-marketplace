"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { setClaimDish } from "@/app/mission-actions";
import { dishImage, type Dish } from "@/lib/dishes";
import { Check } from "./icons";
import { Button, StickyFooter } from "./ui";

/**
 * Suggestions de plats, montrées une fois la mission prise : les photos
 * aident à décider quoi apporter, pas à choisir la mission. Rien n'est
 * enregistré tant qu'on n'a pas confirmé.
 */
export function DishPicker({
  shabbatId,
  missionId,
  dishes,
  selectedKeys,
  customLabel,
}: {
  shabbatId: string;
  missionId: string;
  dishes: Dish[];
  selectedKeys: string[];
  customLabel: string | null;
}) {
  const t = useTranslations("missions.dishes");
  // Plusieurs plats pour une même mission : on apporte rarement une seule
  // chose, et rien n'oblige à choisir.
  const [choices, setChoices] = useState<string[]>(selectedKeys);
  const [custom, setCustom] = useState(customLabel ?? "");
  const [typing, setTyping] = useState(Boolean(customLabel) && !selectedKeys.length);
  const [pending, startTransition] = useTransition();

  const chosen = dishes.filter((d) => choices.includes(d.key));
  const label = chosen.length
    ? chosen.map((d) => d.label).join(", ")
    : (custom.trim() || null);
  const dirty =
    choices.join("|") !== selectedKeys.join("|") || custom.trim() !== (customLabel ?? "");

  function toggle(key: string) {
    setChoices((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
    setTyping(false);
  }

  function confirm() {
    startTransition(() =>
      setClaimDish(shabbatId, missionId, choices, choices.length ? null : custom.trim() || null),
    );
  }

  return (
    <section className="mt-4">
      <div className="mb-2.5 text-[12.5px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
        {t("title")}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {dishes.map((dish) => {
          const selected = choices.includes(dish.key);
          return (
            <button
              key={dish.key}
              type="button"
              onClick={() => toggle(dish.key)}
              className={`overflow-hidden rounded-card bg-white text-start shadow-[var(--shadow-card)] ${
                selected ? "ring-2 ring-teal" : ""
              }`}
            >
              <span className="relative block aspect-square">
                <Image
                  src={dishImage(dish.key)}
                  alt=""
                  fill
                  sizes="(max-width: 430px) 45vw, 180px"
                  className="object-cover"
                />
                {selected && (
                  <span className="absolute top-1.5 end-1.5 flex size-[22px] items-center justify-center rounded-full bg-teal">
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </span>
                )}
              </span>
              <span className="block px-2.5 py-2 text-[13.5px] font-bold">{dish.label}</span>
            </button>
          );
        })}
      </div>

      {typing ? (
        <input
          autoFocus
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setChoices([]);
          }}
          placeholder={t("customPlaceholder")}
          className="mt-2.5 w-full rounded-field border-[1.5px] border-line bg-white px-3.5 py-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-teal/40"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setTyping(true);
            setChoices([]);
          }}
          className="mt-2.5 w-full rounded-field border-[1.5px] border-dashed border-ink/20 py-3 text-[14px] font-bold text-ink/65"
        >
          {t("noneOfThese")}
        </button>
      )}

      {(dirty || !selectedKeys.length) && label && (
        <StickyFooter className="px-5 py-2.5">
          <Button type="button" onClick={confirm} disabled={pending}>
            {t("confirm")}
          </Button>
        </StickyFooter>
      )}
    </section>
  );
}
