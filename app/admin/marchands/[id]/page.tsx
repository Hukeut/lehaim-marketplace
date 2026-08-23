import { redirect } from "next/navigation";

/** Voir /admin/marchands/page.tsx — remplacé par /admin/validation/[id]. */
export default async function AdminMarchand({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(id === "nouvelle" ? "/admin/validation" : `/admin/validation/${id}`);
}
