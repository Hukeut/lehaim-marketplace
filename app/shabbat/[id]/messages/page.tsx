import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { buildMessage, MESSAGE_TABS, type MessageKind } from "@/lib/whatsapp";
import { MessagePicker } from "./MessagePicker";

/** S16 · Générateur de messages WhatsApp */
export default async function MessagesWhatsApp({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const messages = Object.fromEntries(
    MESSAGE_TABS.map((tab) => [tab.key, buildMessage(tab.key, shabbat, ops)]),
  ) as Record<MessageKind, { body: string; audience: string }>;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback={`/shabbat/${id}`} />
        <h1 className="flex-1 font-display text-[18px] font-semibold">
          Messages prêts à l&apos;emploi
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2.5 pb-6">
        <MessagePicker messages={messages} shareUrlPath={`/s/${shabbat.shareToken}`} />
      </div>
    </main>
  );
}
