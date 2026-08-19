import { ServicesPage } from "./services-page";
export default async function Page() {
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.VERCEL === "1") {
    return <ServicesPage services={[]} managed={[]} />;
  }

  const { listServices } = await import("../../db/services");
  const { listServiceItems } = await import("../../db/service-items");
  return (
    <ServicesPage
      services={await listServices()}
      managed={await listServiceItems()}
    />
  );
}
