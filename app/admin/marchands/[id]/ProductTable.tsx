"use client";

import { useRef, useTransition } from "react";
import { addProduct, removeProduct, toggleProduct } from "@/app/admin/actions";
import { AdminTable, Td } from "@/components/admin";

const field =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-teal/40";

/**
 * Catalogue d'une boutique. La ligne de saisie reste en haut et garde le
 * focus après l'envoi : on saisit vingt produits d'affilée, pas un.
 */
export function ProductTable({
  shopId,
  products,
}: {
  shopId: string;
  products: Record<string, unknown>[];
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  return (
    <div className={pending ? "opacity-70" : ""}>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await addProduct(formData);
            formRef.current?.reset();
            nameRef.current?.focus();
          });
        }}
        className="mb-4 grid gap-2 rounded-[18px] bg-white p-4 shadow-[var(--shadow-card)] sm:grid-cols-[2fr_2fr_1fr_auto]"
      >
        <input type="hidden" name="shop_id" value={shopId} />
        <input ref={nameRef} name="name" placeholder="Nom du produit" className={field} required />
        <input name="hint" placeholder="Précision (pour 8 personnes…)" className={field} />
        <input name="price" placeholder="Prix" inputMode="decimal" className={field} />
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-bold text-white"
        >
          Ajouter
        </button>
      </form>

      {products.length ? (
        <AdminTable columns={["Produit", "Précision", "Prix", "Disponible", ""]}>
          {products.map((product) => {
            const id = product.id as string;
            const available = Boolean(product.available);
            return (
              <tr key={id}>
                <Td>{product.name as string}</Td>
                <Td muted>{(product.hint as string) ?? "—"}</Td>
                <Td muted>{Number(product.price ?? 0).toFixed(2)} €</Td>
                <Td muted>
                  <button
                    type="button"
                    onClick={() => startTransition(() => toggleProduct(shopId, id, available))}
                    className={`relative block h-[22px] w-[38px] rounded-full transition-colors ${
                      available ? "bg-teal" : "bg-line"
                    }`}
                    aria-label={available ? "Rendre indisponible" : "Rendre disponible"}
                  >
                    <span
                      className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-all ${
                        available ? "start-[19px]" : "start-[3px]"
                      }`}
                    />
                  </button>
                </Td>
                <Td muted>
                  <button
                    type="button"
                    onClick={() => startTransition(() => removeProduct(shopId, id))}
                    className="font-bold text-coral-deep"
                  >
                    Retirer
                  </button>
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <p className="rounded-[18px] border-[1.5px] border-dashed border-line bg-white/60 px-6 py-10 text-center text-[14px] text-ink/45">
          Aucun produit. Saisissez le premier ci-dessus.
        </p>
      )}
    </div>
  );
}
