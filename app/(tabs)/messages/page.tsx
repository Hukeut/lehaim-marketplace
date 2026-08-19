import Link from "next/link";
import { EmptyState, SignedOut } from "@/components/States";
import { Avatar, Card, ScreenBody } from "@/components/ui";
import { formatDate, listThreads } from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";
import { BrandMark } from "@/components/BrandMark";

/** 18 · Messages — un fil par Shabbat (pas de messagerie 1:1). */
export default async function Messages() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <ScreenBody>
        <BrandMark className="mb-3" />
        <h1 className="mb-4 font-display text-[19px] font-semibold">Messages</h1>
        <SignedOut suite="/messages" what="vos conversations" />
      </ScreenBody>
    );
  }

  const threads = await listThreads();

  return (
    <ScreenBody>
      <BrandMark className="mb-3" />
      <h1 className="mb-3.5 font-display text-[19px] font-semibold">Messages</h1>

      {threads.length ? (
        <ul className="flex flex-col gap-1">
          {threads.map(({ shabbat, lastMessage }) => (
            <Card as="li" key={shabbat.id}>
              <Link href={`/discussion/${shabbat.id}`} className="flex items-center gap-3 p-3">
                <Avatar
                  initial={shabbat.title.charAt(0).toUpperCase()}
                  tone={shabbat.isHost ? "coral" : "violet"}
                  size={42}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-[13px] font-bold">{shabbat.title}</span>
                    <span className="shrink-0 text-[10.5px] text-ink/40">
                      {formatDate(shabbat.startsAt)}
                    </span>
                  </div>
                  <div className="truncate text-[11.5px] text-ink/55">
                    {lastMessage
                      ? `${lastMessage.mine ? "Vous" : lastMessage.author.name} : ${lastMessage.body}`
                      : "Aucun message pour l'instant"}
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      ) : (
        <EmptyState
          illustration="/illustrations/mes-proches-communaute.jpg"
          title="Pas encore de conversation"
          text="Chaque Shabbat a son fil de discussion. Créez-en un ou rejoignez une table."
          cta="Créer un Shabbat"
          href="/creer"
        />
      )}
    </ScreenBody>
  );
}
