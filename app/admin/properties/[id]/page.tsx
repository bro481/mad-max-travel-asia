import { notFound } from "next/navigation";import { getProperty } from "../../../../db/properties";import { PropertyEditor } from "../property-editor";
export default async function EditProperty({params}:{params:Promise<{id:string}>}){const {id}=await params;const item=await getProperty(Number(id));if(!item)notFound();return <PropertyEditor initial={item}/>}
