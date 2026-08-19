import type { AvatarTone, PillTone } from "@/components/ui";

/**
 * Données de démonstration reprises telles quelles du fichier de design.
 * Elles seront remplacées écran par écran au branchement de Supabase.
 */

export const me = {
  firstName: "Noa",
  fullName: "Noa Amsalem",
  initial: "N",
  tone: "coral" as AvatarTone,
  memberSince: "Membre depuis mars 2025",
  phone: "06 12 34 56 78",
  email: "noa.a@email.com",
  stats: { organises: 3, joined: 12, contacts: 44 },
  circles: [
    { label: "Famille", count: 4 },
    { label: "Amis", count: 12 },
  ],
};

export type Guest = {
  id: string;
  name: string;
  initial: string;
  tone: AvatarTone;
  phone?: string;
  role?: string;
  roleDetail?: string;
  status: "confirmed" | "pending";
};

export const guests: Guest[] = [
  {
    id: "david",
    name: "David",
    initial: "D",
    tone: "coral",
    phone: "06 12 34 56 78",
    role: "Chef",
    roleDetail: "Côtes braisées",
    status: "confirmed",
  },
  {
    id: "shira",
    name: "Shira",
    initial: "S",
    tone: "violet",
    phone: "06 98 76 54 32",
    role: "Boissons",
    status: "confirmed",
  },
  {
    id: "ari",
    name: "Ari Cohen",
    initial: "A",
    tone: "olive",
    phone: "06 44 22 11 33",
    role: "Entrées",
    roleDetail: "Houmous maison",
    status: "confirmed",
  },
  {
    id: "tamar",
    name: "Tamar Levi",
    initial: "T",
    tone: "teal",
    phone: "06 77 88 99 00",
    status: "confirmed",
  },
  {
    id: "rivka",
    name: "Rivka Azoulay",
    initial: "R",
    tone: "gold",
    phone: "06 55 44 33 22",
    status: "pending",
  },
  {
    id: "michael",
    name: "Michael Attias",
    initial: "M",
    tone: "ink",
    phone: "06 22 11 99 88",
    status: "pending",
  },
];

export const shabbat = {
  id: "15-aout",
  title: "Shabbat chez vous",
  hosts: "Noa & David",
  dateLabel: "Vendredi 15 août",
  timeLabel: "19h30",
  address: "12 rue Lepic, Paris",
  neighbourhood: "Montmartre",
  countdown: "Dans 3 jours",
  readiness: 68,
  guests: { confirmed: 7, total: 9 },
  menu: { done: 5, total: 8 },
  shopping: { done: 12, total: 18 },
  budget: { spent: 145, planned: 200 },
  shareLink: "lehaim.app/s/8x2fq1",
};

export type Dish = {
  name: string;
  course: "Entrées" | "Plats" | "Desserts";
  by?: string;
  status: "done" | "cooking" | "todo";
};

export const menu: Dish[] = [
  { name: "Houmous maison", course: "Entrées", by: "Ari", status: "done" },
  { name: "Côtes braisées", course: "Plats", by: "Vous", status: "cooking" },
  { name: "Riz aux vermicelles", course: "Plats", by: "Tamar", status: "todo" },
  { name: "Salade de fenouil", course: "Entrées", by: "Shira", status: "todo" },
];

export const dishStatusLabel: Record<Dish["status"], { label: string; tone: PillTone }> = {
  done: { label: "Terminé", tone: "success" },
  cooking: { label: "En cuisson", tone: "warning" },
  todo: { label: "À faire", tone: "neutral" },
};

export const shoppingItems = [
  { name: "Vin rouge", qty: "3 bouteilles", done: false },
  { name: "Tahini", qty: "1 pot", done: false },
  { name: "Salade verte", qty: "2 sachets", done: false },
  { name: "Hallot", qty: "2", done: true },
  { name: "Bougies", qty: "1 boîte", done: true },
  { name: "Jus de raisin", qty: "2 bouteilles", done: true },
];

export const roles = [
  { name: "Chef", by: "David", tone: "coral" as const },
  { name: "Boissons", by: "Shira", tone: "teal" as const },
];

export const conversations = [
  {
    id: "shira",
    name: "Shira",
    initial: "S",
    tone: "violet" as AvatarTone,
    preview: "On amène le vin, pas de souci !",
    time: "14:02",
    unread: true,
  },
  {
    id: "david",
    name: "David",
    initial: "D",
    tone: "coral" as AvatarTone,
    preview: "Je m'occupe des côtes braisées 🙂",
    time: "Hier",
    unread: false,
  },
  {
    id: "tzvi",
    name: "Tzvi & Rivka",
    initial: "T",
    tone: "olive" as AvatarTone,
    preview: "Merci pour cette belle soirée !",
    time: "Lun.",
    unread: false,
  },
];

export const thread = {
  shira: {
    name: "Shira",
    initial: "S",
    tone: "violet" as AvatarTone,
    messages: [
      { from: "them", text: "Coucou ! Vous voulez qu'on amène quelque chose vendredi ?" },
      { from: "me", text: "Avec plaisir, il nous manque du vin et une salade 🙂" },
      { from: "them", text: "On amène le vin, pas de souci !" },
    ],
    time: "14:02",
  },
} as const;

export const pastShabbats = [
  { id: "1er-aout", title: "Shabbat du 1er août", detail: "9 invités · Terminé" },
];

export const joinedShabbats = [
  {
    id: "shira-eyal",
    title: "Shabbat chez Shira & Eyal",
    detail: "Vendredi 22 août · 19h00",
    place: "Montmartre",
    pill: "Confirmé",
  },
];

export const todos = [
  {
    icon: "role" as const,
    title: "Assigner 3 rôles",
    subtitle: "2 invités sans tâche",
    pill: "Urgent",
    href: "/shabbat/15-aout/invites",
  },
  {
    icon: "invite" as const,
    title: "2 invitations en attente",
    subtitle: "Rivka · Michael",
    href: "/shabbat/15-aout/inviter",
  },
  {
    icon: "shopping" as const,
    title: "6 articles restants",
    subtitle: "Vin, tahini, salade…",
    href: "/shabbat/15-aout",
  },
];

export const activity = [
  { text: "**David** a confirmé sa présence", fresh: true },
  { text: "Rappel : acheter le vin avant jeudi", fresh: false },
];
