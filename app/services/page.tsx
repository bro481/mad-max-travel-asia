import {listServices} from "../../db/services";import {ServicesPage} from "./services-page";
export default async function Page(){return <ServicesPage services={await listServices()}/>}
