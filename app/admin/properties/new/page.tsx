"use client";
import { useEffect, useState } from "react";
import type { DestinationRecord } from "../../../../db/destinations";
import { PropertyEditor } from "../property-editor";
export default function NewProperty(){const [destinations,setDestinations]=useState<DestinationRecord[]>([]);useEffect(()=>{fetch("/api/admin/destinations").then(async r=>{if(!r.ok)return [];const text=await r.text();return text?JSON.parse(text):[]}).then(setDestinations)},[]);return <PropertyEditor destinations={destinations}/>}
