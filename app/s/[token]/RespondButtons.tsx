"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { respond, type RespondState } from "./actions";

const INITIAL: RespondState = { error: null };

/**
 * G02 · « Je viens » / « Je ne peux pas », répondus directement depuis le
 * lien WhatsApp — sans écran intermédiaire.
 *
 * Un simple formulaire : la réponse part au serveur, qui redirige lui-même.
 * Le navigateur n'a plus à connaître Supabase pour ça.
 */
export function RespondButtons({ token }: { token: string }) {
  const t = useTranslations("invitation.shareLanding");
  const [state, formAction, pending] = useActionState(respond, INITIAL);
  const [clicked, setClicked] = useState<"confirmed" | "declined" | null>(null);

  const label = (answer: "confirmed" | "declined", idle: string) =>
    pending && clicked === answer ? t("responding") : idle;

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="flex gap-2.5">
        <button
          type="submit"
          name="answer"
          value="confirmed"
          onClick={() => setClicked("confirmed")}
          disabled={pending}
          className="flex-[2] rounded-full bg-coral py-3.5 font-display text-[16px] font-semibold text-white shadow-[var(--shadow-coral)] transition-transform active:scale-[0.985] disabled:opacity-60"
        >
          {label("confirmed", t("imComing"))}
        </button>
        <button
          type="submit"
          name="answer"
          value="declined"
          onClick={() => setClicked("declined")}
          disabled={pending}
          className="flex-1 rounded-full border-2 border-line bg-white py-3 font-display text-[15px] font-semibold text-ink/55 disabled:opacity-60"
        >
          {label("declined", t("cantMakeIt"))}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 text-center text-[13.5px] font-bold text-coral-deep">
          {state.error}
        </p>
      )}
    </form>
  );
}
