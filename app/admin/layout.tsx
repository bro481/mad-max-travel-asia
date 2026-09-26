import { headers } from "next/headers";
import Link from "next/link";
import "./admin.css";
import "./services/services-admin.css";

const ADMIN_UI_VERSION = "admin-ui-mobile-2026-09-26";
const adminLinks = [
  { href: "/admin", icon: "⌂", label: "Dashboard", mobileLabel: "首页" },
  { href: "/admin/properties", icon: "▦", label: "房源管理" },
  { href: "/admin/services", icon: "◇", label: "当地服务" },
  { href: "/admin/packages", icon: "✦", label: "省心套餐", mobileLabel: "套餐管理" },
  { href: "/admin/gifts", icon: "◈", label: "大马特产" },
  { href: "/admin/travel-guides", icon: "◌", label: "旅行攻略" },
  { href: "/admin/inquiries", icon: "☏", label: "客户咨询" },
  { href: "/admin/referrers", icon: "◎", label: "司机推广", mobileLabel: "司机管理" },
  { href: "/admin/content", icon: "▤", label: "内容管理" },
  { href: "/admin/settings", icon: "⚙", label: "设置" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-admin-pathname");
  if (pathname === "/admin/login") {
    return <main className="admin-login-page">{children}</main>;
  }

  return (
    <div className="admin-shell">
      <header className="admin-mobile-top">
        <details className="admin-mobile-drawer">
          <summary aria-label="打开菜单">☰</summary>
          <div className="admin-mobile-drawer-panel">
            <strong>MAD MAX</strong>
            <nav>
              {adminLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                  <span>{link.icon}</span>
                  {link.mobileLabel || link.label}
                </Link>
              ))}
              <Link href="/api/admin/logout?return_to=/">退出登录</Link>
            </nav>
          </div>
        </details>
        <Link href="/admin" className="admin-mobile-title">MAD MAX</Link>
        <Link href="/admin/inquiries" className="admin-mobile-alert" aria-label="客户咨询">🔔</Link>
      </header>
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
          {adminLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.icon} <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-user">
          <b>管理员后台</b>
          <small>{ADMIN_UI_VERSION}</small>
          <Link href="/">返回前台</Link>
          <Link href="/api/admin/logout?return_to=/">退出登录</Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
      <nav className="admin-mobile-bottom" aria-label="手机快捷导航">
        <Link href="/admin">首页</Link>
        <Link href="/admin/inquiries">咨询</Link>
        <Link href="/admin/travel-guides">内容</Link>
        <Link href="/admin/packages">订单</Link>
        <Link href="/admin/settings">我的</Link>
      </nav>
    </div>
  );
}
