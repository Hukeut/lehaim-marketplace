import { brandIcon } from "@/lib/brand-icon";

/** Icône PNG du manifeste. Chrome/Android en exige du raster. */
export function GET() {
  return brandIcon(192);
}
