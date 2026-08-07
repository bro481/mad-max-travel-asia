import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  ensureServiceItems,
  listServiceItems,
} from "../../../../db/service-items";
export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listServiceItems(true));
}
export async function POST(r: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureServiceItems();
  const b = await r.json();
  const base =
    String(b.slug || b.nameEn || "new-service")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "new-service";
  let slug = base,
    n = 1;
  while (
    await env.DB.prepare("SELECT id FROM service_items WHERE slug=?")
      .bind(slug)
      .first()
  )
    slug = `${base}-${++n}`;
  const type = b.type || "交通接送";
  const isCar = type === "私人包车";
  const isJourney = ["城市体验", "一日路线", "海岛体验"].includes(type);
  const steps =
    isCar || isJourney
      ? []
      : [
          { title: "告诉我们行程", description: "提供日期、地点和同行人数" },
          { title: "确认安排", description: "顾问确认车辆、司机与接送时间" },
          { title: "轻松出发", description: "按约定时间与地点开始服务" },
        ];
  const routes = isCar
    ? [
        {
          name: "经典一日包车",
          duration: "约 8 小时",
          tag: "首次到访",
          description: "路线可按客人节奏灵活调整。",
          stops: "双子塔 · 独立广场 · 茨厂街",
          image: "",
        },
      ]
    : [];
  const timeline = isJourney
    ? [
        { time: "08:00", title: "酒店接送", description: "从住宿地点轻松出发" },
        { time: "10:00", title: "开始体验", description: "由当地向导带领游览" },
        {
          time: "13:00",
          title: "午餐与休息",
          description: "根据当天路线灵活安排",
        },
        { time: "17:30", title: "返回酒店", description: "结束充实的一天" },
      ]
    : [];
  const inquiryFields = isCar
    ? ["计划日期", "出发地点", "同行人数", "想去的地点", "特殊需求"]
    : isJourney
      ? ["计划日期", "同行人数", "接送地点", "特殊需求"]
      : ["计划日期", "出发地点", "目的地", "同行人数", "航班信息"];
  const x = await env.DB.prepare(
    "INSERT INTO service_items(slug,type,city,category,name_zh,name_en,steps,routes,timeline,inquiry_fields,status)VALUES(?,?,?,?,?,?,?,?,?,?,?)",
  )
    .bind(
      slug,
      type,
      b.city || "吉隆坡",
      b.category || "交通服务",
      b.nameZh || "新服务",
      b.nameEn || "New service",
      JSON.stringify(steps),
      JSON.stringify(routes),
      JSON.stringify(timeline),
      JSON.stringify(inquiryFields),
      "draft",
    )
    .run();
  return NextResponse.json({ id: x.meta.last_row_id, slug }, { status: 201 });
}
