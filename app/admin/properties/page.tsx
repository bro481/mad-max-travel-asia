import { listProperties } from "../../../db/properties";
import { PropertyList } from "./property-list";
export default async function PropertiesPage(){return <PropertyList initialItems={await listProperties()}/>}
