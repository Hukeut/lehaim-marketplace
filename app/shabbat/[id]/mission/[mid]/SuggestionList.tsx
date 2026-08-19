"use client";

import { useActionState, useRef } from "react";
import { addSuggestion, chooseSuggestion, toggleVote } from "@/app/mission-actions";
import { Card } from "@/components/ui";
import type { ActionState } from "@/app/actions";
import type { Suggestion } from "@/lib/missions";

const initial: ActionState = { ok: false, message: null };

/** S09 · Suggestions attachées à une mission. */
export function SuggestionList({
  shabbatId,
  missionId,
  suggestions,
  canChoose,
}: {
  shabbatId: string;
  missionId: string;
  suggestions: Suggestion[];
  /** Le responsable de la mission ou l'hôte peut trancher. */
  canChoose: boolean;
}) {
  const [, formAction, pending] = useActionState(addSuggestion, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <form
        action={(fd) => {
          formAction(fd);
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="mb-3"
      >
        <input type="hidden" name="mission_id" value={missionId} />
        <input type="hidden" name="shabbat_id" value={shabbatId} />
        <div className="flex gap-2">
          <input
            ref={inputRef}
            name="body"
            required
            placeholder="Proposer une idée…"
            className="min-w-0 flex-1 rounded-field border-[1.5px] border-line-soft bg-white px-3.5 py-3 text-[12.5px] shadow-[0_2px_8px_rgba(13,43,62,0.06)] outline-none focus:ring-2 focus:ring-teal/40"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-field bg-teal px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            Proposer
          </button>
        </div>
      </form>

      {suggestions.length ? (
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <Card
              as="li"
              key={suggestion.id}
              className={suggestion.chosen ? "border-2 border-olive" : ""}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{suggestion.body}</div>
                  <div className="text-[10.5px] text-ink/50">Proposé par {suggestion.author}</div>
                </div>

                {suggestion.chosen ? (
                  <span className="shrink-0 rounded-full bg-olive/14 px-2.5 py-1.5 text-[10px] font-extrabold whitespace-nowrap text-olive-deep">
                    Choisi
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    {canChoose && (
                      <form
                        action={chooseSuggestion.bind(null, shabbatId, missionId, suggestion.id)}
                      >
                        <button
                          type="submit"
                          className="text-[11px] font-bold text-teal"
                        >
                          Choisir
                        </button>
                      </form>
                    )}
                    <form
                      action={toggleVote.bind(
                        null,
                        shabbatId,
                        missionId,
                        suggestion.id,
                        suggestion.votedByMe,
                      )}
                    >
                      <button
                        type="submit"
                        aria-label={suggestion.votedByMe ? "Retirer mon vote" : "Voter"}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
                          suggestion.votedByMe
                            ? "bg-teal text-white"
                            : "bg-teal/12 text-teal-deep"
                        }`}
                      >
                        👍 {suggestion.votes}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </ul>
      ) : (
        <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-3 text-[12.5px] text-ink/40">
          Aucune idée proposée pour l&apos;instant.
        </p>
      )}
    </>
  );
}
