import Link from "next/link";
const pages=[['首页','Hero、主标题、描述、图片和按钮'],['关于我们','品牌故事、服务承诺和团队介绍'],['联系页','咨询说明、联系入口与提示文案'],['Footer','页脚导航、版权和社交信息'],['通用文案','跨页面重复使用的提示和按钮文字']];
export default function Content(){return <><div className="admin-head"><div><p>公共页面</p><h1>内容管理</h1><span>这里只管理网站公共内容，房源和服务仍在各自模块维护。</span></div></div><div className="admin-section-grid">{pages.map(([name,text])=><Link className="admin-section-card" href={`/admin/content/edit?section=${encodeURIComponent(name)}`} key={name}><h2>{name}</h2><p>{text}</p></Link>)}</div></>}
