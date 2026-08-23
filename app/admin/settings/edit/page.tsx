"use client";
import { Suspense } from "react";
import {useSearchParams} from "next/navigation";

function SettingEditForm(){const name=useSearchParams().get("section")||"网站";return <><div className="admin-head"><div><p>设置</p><h1>{name}</h1><span>{name==="合作方 / 推荐码"?"管理师傅和合作伙伴的专属推荐来源。":"修改网站全局配置。"}</span></div><button className="admin-primary">保存设置</button></div>{name==="合作方 / 推荐码"?<div className="simple-admin-panel simple-admin-table"><div className="simple-admin-row header"><span>合作方</span><span>推荐码</span><span>专属链接</span><span>状态</span></div><div className="simple-admin-row"><b>陈师傅</b><span>A01</span><span>?ref=A01</span><span>启用</span></div></div>:<div className="simple-admin-panel simple-admin-form"><label><span>{name==="网站"?"网站名称":"微信"}</span><input/></label><label><span>{name==="网站"?"默认币种":"WhatsApp"}</span><input defaultValue={name==="网站"?"RM":""}/></label><label><span>{name==="网站"?"默认语言":"电话 / Email"}</span><input defaultValue={name==="网站"?"中文 / English":""}/></label></div>}</>}

export default function SettingEdit(){return <Suspense fallback={null}><SettingEditForm /></Suspense>}
