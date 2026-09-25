import { notFound } from "next/navigation";
import type { CustomerShareProductType } from "../../../../db/customer-shares";
import { buildQuickShareImage } from "../../../../lib/quick-share-materials";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as CustomerShareProductType | null;
  const id = url.searchParams.get("id") || "";
  if (!type || !id) notFound();
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";
  const result = await buildQuickShareImage({
    type,
    id,
    url: url.searchParams.get("url") || undefined,
    kind: "long",
    format,
  });
  if (!result) notFound();
  return new Response(result.body, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
      "Content-Disposition": `${format === "svg" ? "inline" : "attachment"}; filename="madmax-${result.content.slug}-share-long.${format}"`,
    },
  });
}
