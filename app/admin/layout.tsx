import Link from "next/link";
import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import "./admin.css";

export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const user=await requireChatGPTUser("/admin");
 return <div className="admin-shell"><aside className="admin-side"><Link href="/admin" className="admin-brand"><span>MY</span><b>Malaysia<br/><small>销售工作台</small></b></Link><nav><Link href="/admin">⌂ <span>Dashboard</span></Link><Link className="active" href="/admin/properties">▦ <span>房源管理</span></Link><span className="disabled">◇ <i>服务管理</i><small>即将开发</small></span><span className="disabled">☏ <i>客户咨询</i><small>下一阶段</small></span><span className="disabled">▤ <i>内容管理</i></span><span className="disabled">⚙ <i>设置</i></span></nav><div className="admin-user"><b>{user.displayName}</b><a href={chatGPTSignOutPath("/")}>退出后台</a></div></aside><main className="admin-main">{children}</main></div>
}
