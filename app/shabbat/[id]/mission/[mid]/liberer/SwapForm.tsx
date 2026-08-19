"use client";

import { useActionState, useState } from "react";
import { releaseMission, requestSwap } from "@/app/mission-actions";
import { Check } from "@/components/icons";
import { Avatar, Button, Card, StickyFooter } from "@/components/ui";
import type { ActionState } from "@/app/actions";
import type { AvatarTone } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

export function SwapForm({
  shabbatId,
  missionId,
  candidates,
}: {
  shabbatId: string;
  missionId: string;
  candidates: { id: string; name: string; initial: string; tone: AvatarTone; detail: string }[];
}) {
  const [state, formAction, pending] = useActionState(requestSwap, initial);
  const [target, setTarget] = useState<string | null>(null);
  const chosen = candidates.find((c) => c.id === target);

  return (
    <>
      <form action={formAction} id="swap-form" className="flex-1 overflow-y-auto px-5.5 pb-4">
        <input type="hidden" name="shabbat_id" value={shabbatId} />
        <input type="hidden" name="mission_id" value={missionId} />
        <input type="hidden" name="to_id" value={target ?? ""} />

        <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
          Pas de souci — proposez cette mission à quelqu&apos;un d&apos;autre ou remettez-la dans
          le pot commun.
        </p>

        {candidates.length ? (
          <ul className="flex flex-col gap-2">
            {candidates.map((person) => {
              const selected = target === person.id;
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => setTarget(selected ? null : person.id)}
                    className="w-full text-left"
                  >
                    <Card
                      className={`flex items-center gap-3 rounded-field px-3.5 py-3 ${selected ? "border-2 border-teal" : ""}`}
                    >
                      <Avatar initial={person.initial} tone={person.tone} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-bold">
                          {person.name}
                        </span>
                        <span className="block text-[10.5px] text-ink/50">{person.detail}</span>
                      </span>
                      <span
                        className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                          selected ? "bg-teal text-white" : "border-2 border-line"
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                    </Card>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-3 text-[12.5px] text-ink/45">
            Personne d&apos;autre n&apos;est encore confirmé — remettez la mission dans le pot
            commun.
          </p>
        )}

        {state.message && (
          <p className="mt-3 text-[11.5px] font-bold text-ink/60">{state.message}</p>
        )}
      </form>

      <StickyFooter className="flex flex-col gap-2.5 px-5.5">
        <Button type="submit" form="swap-form" size="md" disabled={!target || pending}>
          {chosen ? `Envoyer la demande à ${chosen.name}` : "Choisissez quelqu'un"}
        </Button>
        <form action={releaseMission.bind(null, shabbatId, missionId)}>
          <Button type="submit" variant="ghost" size="sm">
            Remettre dans le pot commun
          </Button>
        </form>
      </StickyFooter>
    </>
  );
}
