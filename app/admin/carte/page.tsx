import { AdminTitle, StatusTag } from "@/components/admin";
import { myProducts, requireMyShop } from "@/lib/merchant";
import { CatalogueEditor } from "./CatalogueEditor";

/** Ma carte — ce que voient les clients sur la fiche du commerce. */
export default async function Carte() {
  const shop = await requireMyShop();
  const products = await myProducts(shop.id);
  const onSale = products.filter((p) => p.available).length;

  return (
    <>
      <AdminTitle
        title="Ma carte"
        action={
          <StatusTag
            status={onSale > 0 ? "ok" : "draft"}
            label={`${onSale} en vente sur ${products.length}`}
          />
        }
      />
      <CatalogueEditor products={products} shopId={shop.id} />
    </>
  );
}
