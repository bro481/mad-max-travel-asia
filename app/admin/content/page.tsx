import Link from "next/link";
const pages=[
  {name:"首页",text:"Hero、主标题、描述、图片和按钮",href:"/admin/content/edit?section=%E9%A6%96%E9%A1%B5"},
  {name:"目的地管理",text:"房源和当地服务共用的目的地库",href:"/admin/content/destinations"},
  {name:"关于我们",text:"品牌故事、服务承诺和团队介绍",href:"/admin/content/edit?section=%E5%85%B3%E4%BA%8E%E6%88%91%E4%BB%AC"},
  {name:"联系页",text:"咨询说明、联系入口与提示文案",href:"/admin/content/edit?section=%E8%81%94%E7%B3%BB%E9%A1%B5"},
  {name:"Footer",text:"页脚导航、版权和社交信息",href:"/admin/content/edit?section=Footer"},
  {name:"通用文案",text:"跨页面重复使用的提示和按钮文字",href:"/admin/content/edit?section=%E9%80%9A%E7%94%A8%E6%96%87%E6%A1%88"},
];
export default function Content(){return <><div className="admin-head"><div><p>公共页面</p><h1>内容管理</h1><span>这里只管理网站公共内容，房源和服务仍在各自模块维护。</span></div></div><div className="admin-section-grid">{pages.map((page)=><Link className="admin-section-card" href={page.href} key={page.name}><h2>{page.name}</h2><p>{page.text}</p></Link>)}</div></>}
