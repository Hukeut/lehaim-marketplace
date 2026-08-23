import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/marketplace-types";

/** Frise de progression d'une commande, du point de vue du client. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "annulee") {
    return (
      <div className="rounded-field bg-coral-wash px-3 py-2 text-[11.5px] font-bold text-coral-deep">
        Commande annulée
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === ORDER_STATUS_FLOW.length - 1;
        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`size-2.5 rounded-full ${done ? "bg-teal" : "bg-line"}`}
                aria-hidden="true"
              />
              <span
                className={`text-center text-[8.5px] leading-tight font-bold ${
                  done ? "text-teal-deep" : "text-ink/35"
                }`}
              >
                {ORDER_STATUS_LABEL[step]}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mb-3.5 h-[2px] flex-1 ${index < currentIndex ? "bg-teal" : "bg-line"}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
