import { getService } from "../../../db/services";
import { ServiceDetail } from "./service-detail";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
}) {
  const { slug } = await params;
  const { city } = await searchParams;
  const service = await getService(slug);
  if (!service)
    return (
      <main className="not-found">
        <h1>Service not found</h1>
        <a className="button" href="/services">
          返回当地服务
        </a>
      </main>
    );
  return <ServiceDetail service={service} city={city || "kk"} />;
}
