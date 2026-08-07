import { getServiceItemBySlug } from "../../../../db/service-items";
import { ServiceProductDetail } from "./service-product-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    x = await getServiceItemBySlug(slug);
  if (!x)
    return (
      <main className="not-found">
        <h1>Service not found</h1>
        <a href="/services">返回当地服务</a>
      </main>
    );
  return <ServiceProductDetail service={x} />;
}
