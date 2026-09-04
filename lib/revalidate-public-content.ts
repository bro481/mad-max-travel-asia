import { revalidatePath } from "next/cache";

export type PublicContentScope =
  | "properties"
  | "destinations"
  | "services"
  | "settings";

export function revalidatePublicContent(...scopes: PublicContentScope[]) {
  const selected = new Set(scopes);

  if (selected.has("properties") || selected.has("destinations")) {
    revalidatePath("/");
    revalidatePath("/rooms/[slug]", "page");
    revalidatePath("/api/destinations");
  }

  if (selected.has("services") || selected.has("destinations")) {
    revalidatePath("/services");
    revalidatePath("/services/[slug]", "page");
    revalidatePath("/api/destinations");
  }

  if (selected.has("settings")) {
    revalidatePath("/about");
    revalidatePath("/api/site-settings");
  }
}
