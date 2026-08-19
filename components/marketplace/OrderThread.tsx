import type { OrderMessage } from "@/lib/marketplace";
import { OrderMessageComposer } from "@/components/marketplace/OrderMessageComposer";

/** Fil de discussion d'une commande : bulles + composer. Même gabarit que le chat de Shabbat. */
export function OrderThread({ orderId, messages }: { orderId: string; messages: OrderMessage[] }) {
  return (
    <div className="w-full rounded-card bg-line-soft/60 p-3">
      <div className="mb-2 text-[9.5px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
        Discussion
      </div>

      <div className="mb-2.5 flex max-h-[280px] flex-col gap-2 overflow-y-auto">
        {!messages.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3 py-4 text-center text-[11.5px] text-ink/40">
            Aucun message pour l&apos;instant.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex max-w-[85%] flex-col ${
              message.mine ? "self-end items-end" : "self-start items-start"
            }`}
          >
            {!message.mine && (
              <span className="mb-0.5 ml-1 text-[10px] font-bold text-ink/45">
                {message.authorLabel}
              </span>
            )}
            <div
              className={
                message.mine
                  ? "rounded-[14px_14px_4px_14px] bg-teal px-3 py-2 text-left text-[12.5px] leading-relaxed break-words whitespace-pre-line text-white"
                  : "rounded-[14px_14px_14px_4px] bg-white px-3 py-2 text-left text-[12.5px] leading-relaxed break-words whitespace-pre-line shadow-[var(--shadow-card)]"
              }
            >
              {message.body}
            </div>
          </div>
        ))}
      </div>

      <OrderMessageComposer orderId={orderId} />
    </div>
  );
}
