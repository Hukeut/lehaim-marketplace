import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { shopBySlug, shopSlots } from "@/lib/shops";
import { getCurrentProfile } from "@/lib/profile";
import { myPaymentMethods } from "@/lib/payment-methods";
import { ReserverForm } from "./ReserverForm";

/**
 * Réserver — un seul écran, comme dans lehaim-marketplace : mode, créneau,
 * note, et on envoie. Pas de tunnel de validation à part.
 */
export default async function Reserver({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await shopBySlug(slug);
  if (!shop) notFound();

  const [slots, profile, savedCards] = await Promise.all([
    shopSlots(shop.id),
    getCurrentProfile(),
    myPaymentMethods(),
  ]);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-[18px] pt-[54px] pb-1.5">
        <BackButton fallback={`/marketplace/${slug}/carte`} />
        <span className="flex-1 font-display text-[19px] font-semibold">Votre réservation</span>
        <span className="text-[12.5px] font-bold text-ink/50">{shop.name}</span>
      </div>

      <ReserverForm
        shopId={shop.id}
        products={shop.products}
        deliveryAvailable={shop.deliveryAvailable}
        slots={slots}
        defaultFullName={profile?.fullName ?? ""}
        defaultPhone={profile?.phone ?? ""}
        savedCards={savedCards}
      />
    </main>
  );
}
