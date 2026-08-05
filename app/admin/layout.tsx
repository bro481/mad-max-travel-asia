import Link from "next/link";
import "./admin.css";

export default function AdminLayout({children}:{children:React.ReactNode}){
 return <div className="admin-shell"><aside className="admin-side"><Link href="/admin" className="admin-brand"><span>MY</span><b>Malaysia<br/><small>销售工作台</small></b></Link><nav><Link href="/admin">⌂ <span>Dashboard</span></Link><Link className="active" href="/admin/properties">▦ <span>房源管理</span></Link><span className="disabled">◇ <i>服务管理</i><small>即将开发</small></span><span className="disabled">☏ <i>客户咨询</i><small>下一阶段</small></span><span className="disabled">▤ <i>内容管理</i></span><span className="disabled">⚙ <i>设置</i></span></nav><div className="admin-user"><b>管理员后台</b><Link href="/">返回前台</Link></div></aside><main className="admin-main">{children}</main></div>
}
