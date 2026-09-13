import { revalidatePath, revalidateTag } from "next/cache";

export type PublicContentScope =
  | "properties"
  | "destinations"
  | "services"
  | "packages"
  | "settings";

export function revalidatePublicContent(...scopes: PublicContentScope[]) {
  const selected = new Set(scopes);

  if (selected.has("properties") || selected.has("destinations")) {
    revalidatePath("/");
    revalidatePath("/rooms/[slug]", "page");
    revalidatePath("/api/destinations");
  }

  if (selected.has("services") || selected.has("destinations")) {
    revalidateTag("public-services-page-data", { expire: 0 });
    revalidatePath("/services");
    revalidatePath("/services/[slug]", "page");
    revalidatePath("/services/private-car");
    revalidatePath("/api/destinations");
  }

  if (selected.has("packages")) {
    revalidatePath("/");
    revalidatePath("/packages");
  }

  if (selected.has("settings")) {
    revalidatePath("/about");
    revalidatePath("/api/site-settings");
  }
}
