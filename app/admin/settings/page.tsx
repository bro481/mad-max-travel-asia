import Link from "next/link";
const settings=[['网站','网站名称、Logo、默认语言与默认币种'],['联系方式','微信、WhatsApp、电话与 Email'],['合作方 / 推荐码','维护合作方、推荐码与专属链接']];
export default function Settings(){return <><div className="admin-head"><div><p>全局配置</p><h1>设置</h1><span>管理全站共用的信息和业务来源。</span></div></div><div className="admin-section-grid">{settings.map(([name,text])=><Link className="admin-section-card" href={`/admin/settings/edit?section=${encodeURIComponent(name)}`} key={name}><h2>{name}</h2><p>{text}</p></Link>)}</div></>}
