import { redirect } from "next/navigation";
import { requireManager } from "@/lib/access";

/** 08 · Inviter des amis — fusionné avec « Gérer les invités ». */
export default async function Inviter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  redirect(`/shabbat/${id}/invites`);
}
