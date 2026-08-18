/**
 * Types et constantes partagés entre composants serveur ET client.
 * Ce fichier ne doit importer ni "server-only" ni rien qui dépende de
 * "next/headers" (sinon Turbopack refuse de le bundler côté client).
 */

export type TraiteurStatus = "pending" | "approved" | "rejected";
export type ProductCategory = "plat" | "entree" | "salade" | "dessert" | "boisson" | "autre";
export type OrderStatus = "nouvelle" | "acceptee" | "en_preparation" | "prete" | "recuperee" | "annulee";
export type Fulfillment = "retrait" | "livraison";

export type Allergen =
  | "gluten"
  | "fruits_a_coque"
  | "oeufs"
  | "lactose"
  | "soja"
  | "arachide"
  | "poisson"
  | "crustaces"
  | "sesame";

export const ALLERGEN_LABEL: Record<Allergen, { emoji: string; label: string }> = {
  gluten: { emoji: "🌾", label: "Gluten" },
  fruits_a_coque: { emoji: "🥜", label: "Fruits à coque" },
  oeufs: { emoji: "🥚", label: "Œufs" },
  lactose: { emoji: "🥛", label: "Lactose" },
  soja: { emoji: "🫘", label: "Soja" },
  arachide: { emoji: "🥜", label: "Arachide" },
  poisson: { emoji: "🐟", label: "Poisson" },
  crustaces: { emoji: "🦐", label: "Crustacés" },
  sesame: { emoji: "🫙", label: "Sésame" },
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  plat: "Plat",
  entree: "Entrée",
  salade: "Salade",
  dessert: "Dessert",
  boisson: "Boisson",
  autre: "Autre",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  acceptee: "Acceptée",
  en_preparation: "En préparation",
  prete: "Prête",
  recuperee: "Récupérée",
  annulee: "Annulée",
};

export type Traiteur = {
  id: string;
  ownerId: string;
  name: string;
  address: string | null;
  phone: string | null;
  patenteNumber: string | null;
  hechsherName: string | null;
  deliveryAvailable: boolean;
  deliveryZone: string | null;
  status: TraiteurStatus;
  rejectionReason: string | null;
  createdAt: string;
};

export type Product = {
  id: string;
  traiteurId: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: ProductCategory;
  quantityHint: string | null;
  active: boolean;
  allergens: Allergen[];
};

export type OrderItem = {
  id: string;
  productId: string | null;
  title: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  traiteurId: string;
  traiteurName: string;
  userId: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  pickupDate: string | null;
  pickupSlot: string | null;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type OrderWithClient = Order & { clientName: string };

/** Progression linéaire du kanban de suivi, côté traiteur. "annulee" reste hors kanban. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "nouvelle",
  "acceptee",
  "en_preparation",
  "prete",
  "recuperee",
];
