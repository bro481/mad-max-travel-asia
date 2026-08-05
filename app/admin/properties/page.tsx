"use client";
import {useEffect,useState} from "react";import { PropertyList } from "./property-list";import type {PropertyRecord} from "../../../db/properties";
export default function PropertiesPage(){const [items,setItems]=useState<PropertyRecord[]|null>(null);useEffect(()=>{fetch("/api/admin/properties").then(async r=>{if(r.status===401){location.href="/signin-with-chatgpt?return_to=%2Fadmin%2Fproperties";return []}return r.json()}).then(setItems)},[]);return items?<PropertyList initialItems={items}/>:<div className="admin-loading">正在进入房源后台…</div>}
