import { redirect } from "next/navigation";

/** 08 · Inviter des amis — fusionné avec « Gérer les invités ». */
export default async function Inviter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/shabbat/${id}/invites`);
}
