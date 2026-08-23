"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addRoom, chooseRoom, removeRoom, updateRoom } from "@/app/mission-actions";
import { Avatar, Button, Card } from "@/components/ui";
import type { Room } from "@/lib/rooms";

/**
 * Les chambres du couchage. L'hôte les décrit (nom, places, mixité) ;
 * chacun choisit ensuite où il dort, dans la limite des places libres.
 */
export function RoomList({
  shabbatId,
  rooms,
  isHost,
}: {
  shabbatId: string;
  rooms: Room[];
  isHost: boolean;
}) {
  const t = useTranslations("shabbat.rooms");
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className={pending ? "opacity-70" : ""}>
      <ul className="mb-3 flex flex-col gap-2">
        {rooms.map((room) => (
          <Card as="li" key={room.id} className="p-3.5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {isHost ? (
                  <input
                    defaultValue={room.label}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== room.label) {
                        startTransition(() => updateRoom(shabbatId, room.id, { label: next }));
                      }
                    }}
                    className="w-full rounded-lg bg-line-soft/60 px-2 py-1 text-[14px] font-bold outline-none focus:ring-2 focus:ring-teal/40"
                  />
                ) : (
                  <div className="text-[14px] font-bold">{room.label}</div>
                )}
                <div className="mt-1 text-[13.5px] text-ink/55">
                  {t("occupancy", { taken: room.occupants.length, total: room.capacity })}
                  {room.policy ? ` · ${t(`policies.${room.policy}`)}` : ""}
                </div>
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={() => startTransition(() => removeRoom(shabbatId, room.id))}
                  className="shrink-0 text-[13.5px] font-bold text-coral-deep"
                >
                  {t("remove")}
                </button>
              )}
            </div>

            {isHost && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Step
                    label="–"
                    onClick={() =>
                      startTransition(() =>
                        updateRoom(shabbatId, room.id, { capacity: room.capacity - 1 }),
                      )
                    }
                  />
                  <span className="min-w-4 text-center font-display text-[15px] font-semibold">
                    {room.capacity}
                  </span>
                  <Step
                    accent
                    label="+"
                    onClick={() =>
                      startTransition(() =>
                        updateRoom(shabbatId, room.id, { capacity: room.capacity + 1 }),
                      )
                    }
                  />
                </div>
                <div className="flex flex-1 gap-1.5">
                  {(["mixed", "girls", "boys"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        startTransition(() => updateRoom(shabbatId, room.id, { policy: value }))
                      }
                      className={`flex-1 rounded-full py-1.5 text-[13.5px] font-bold ${
                        room.policy === value ? "bg-ink text-white" : "bg-line-soft text-ink/55"
                      }`}
                    >
                      {t(`policies.${value}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {room.occupants.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {room.occupants.map((person) => (
                  <span key={person.id} className="flex items-center gap-1.5">
                    <Avatar initial={person.initial} tone={person.tone} size={24} />
                    <span className="text-[13.5px] font-bold">{person.name}</span>
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={!room.mine && room.free === 0}
              onClick={() =>
                startTransition(() => chooseRoom(shabbatId, room.mine ? null : room.id))
              }
              className={`mt-3 w-full rounded-full py-2.5 text-[14.5px] font-bold disabled:opacity-40 ${
                room.mine ? "bg-teal text-white" : "border-[1.5px] border-line text-ink"
              }`}
            >
              {room.mine ? t("leaveRoom") : room.free === 0 ? t("full") : t("takeRoom")}
            </button>
          </Card>
        ))}
      </ul>

      {rooms.length === 0 && (
        <p className="mb-3 rounded-field border-[1.5px] border-dashed border-line bg-white px-4 py-5 text-center text-[14.5px] text-ink/45">
          {isHost ? t("emptyHost") : t("emptyGuest")}
        </p>
      )}

      {isHost && (
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("newRoomPlaceholder")}
            className="min-w-0 flex-1 rounded-field border-[1.5px] border-line bg-white px-4 py-3 text-[15px] font-bold outline-none focus:ring-2 focus:ring-teal/40"
          />
          <div className="shrink-0">
            <Button
              type="button"
              size="sm"
              disabled={!label.trim()}
              onClick={() => {
                const next = label.trim();
                setLabel("");
                startTransition(() => addRoom(shabbatId, next));
              }}
            >
              {t("addRoom")}
            </Button>
          </div>
        </div>
      )}
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
      className={`flex size-[28px] items-center justify-center rounded-lg text-[15px] font-bold ${
        accent ? "bg-teal text-white" : "bg-line-soft text-ink"
      }`}
    >
      {label}
    </button>
  );
}
