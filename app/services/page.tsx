import { listServices } from "../../db/services";
import { listServiceItems } from "../../db/service-items";
import { ServicesPage } from "./services-page";
export default async function Page() {
  return (
    <ServicesPage
      services={await listServices()}
      managed={await listServiceItems()}
    />
  );
}
