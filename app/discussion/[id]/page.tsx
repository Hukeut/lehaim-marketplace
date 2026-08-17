import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Avatar } from "@/components/ui";
import { formatDate, getThread } from "@/lib/data";
import { MessageComposer } from "./MessageComposer";

/** 19 · Discussion — le fil du Shabbat. */
export default async function Discussion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <header className="flex items-center gap-2.5 bg-cream px-[18px] pt-[54px] pb-3 shadow-[0_1px_0_rgba(13,43,62,0.06)] sm:rounded-t-[36px]">
        <BackButton fallback="/messages" />
        <Avatar
          initial={thread.shabbat.title.charAt(0).toUpperCase()}
          tone="violet"
          size={34}
        />
        <div className="min-w-0">
          <div className="truncate font-display text-[14.5px] font-semibold">
            {thread.shabbat.title}
          </div>
          <div className="text-[10.5px] text-ink/50">
            {formatDate(thread.shabbat.starts_at as string)}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3.5">
        {thread.messages.length ? (
          thread.messages.map((message) => (
            // La largeur maximale porte sur le conteneur : posée sur la bulle,
            // elle valait 75 % de la largeur naturelle du texte, qui débordait.
            <div
              key={message.id}
              className={`flex max-w-[78%] flex-col ${message.mine ? "self-end items-end" : "self-start items-start"}`}
            >
              {!message.mine && (
                <span className="mb-0.5 ml-1 text-[10px] font-bold text-ink/45">
                  {message.author.name}
                </span>
              )}
              <div
                className={
                  message.mine
                    ? "rounded-[16px_16px_4px_16px] bg-teal px-3.5 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-line text-white"
                    : "rounded-[16px_16px_16px_4px] bg-white px-3.5 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-line shadow-[var(--shadow-card)]"
                }
              >
                {message.body}
              </div>
            </div>
          ))
        ) : (
          <p className="mt-8 text-center text-[12.5px] text-ink/45">
            Lancez la conversation — c&apos;est ici qu&apos;on cale les détails.
          </p>
        )}
      </div>

      <MessageComposer shabbatId={id} />
    </main>
  );
}
