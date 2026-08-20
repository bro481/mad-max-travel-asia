import Link from "next/link";
import "./admin.css";
import "./services/services-admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          <span>MY</span>
          <b>
            Malaysia
            <br />
            <small>销售工作台</small>
          </b>
        </Link>
        <nav>
          <Link href="/admin">
            ⌂ <span>Dashboard</span>
          </Link>
          <Link href="/admin/properties">
            ▦ <span>房源管理</span>
          </Link>
          <Link href="/admin/services">
            ◇ <span>当地服务</span>
          </Link>
          <Link href="/admin/inquiries">
            ☏ <span>客户咨询</span>
          </Link>
          <Link href="/admin/content">▤ <span>内容管理</span></Link>
          <Link href="/admin/settings">⚙ <span>设置</span></Link>
        </nav>
        <div className="admin-user">
          <b>管理员后台</b>
          <Link href="/">返回前台</Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
