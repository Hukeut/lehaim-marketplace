import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Basket } from "@/components/icons";
import { anyCart } from "@/lib/cart";
import { money } from "@/lib/shops";

/**
 * La barre de panier, flottante au-dessus des onglets.
 *
 * Elle ne s'affiche que s'il y a quelque chose dedans, et dit le nom du
 * commerce : un panier se remplit sur une fiche, et on le retrouve deux écrans
 * plus loin sans forcément se souvenir de chez qui.
 */
export async function CartBar({ bottom = "bottom-[92px]" }: { bottom?: string }) {
  const cart = await anyCart();
  if (!cart || cart.count === 0) return null;

  const t = await getTranslations("market");

  return (
    <Link
      href="/panier"
      className={`fixed inset-x-[18px] ${bottom} z-20 mx-auto flex max-w-[394px] items-center gap-3 rounded-full bg-ink px-5 py-3.5 text-white shadow-[var(--shadow-dock)]`}
    >
      <Basket size={20} />
      <span className="min-w-0 flex-1 truncate font-display text-[14.5px] font-semibold">
        {t("cart.bar", { count: cart.count, shop: cart.shopName })}
      </span>
      <span className="font-display text-[14.5px] font-semibold">{money(cart.total)}</span>
    </Link>
  );
}
