/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  listServiceItems,
  staticServiceItemRecords,
} from "../../../../db/service-items";
import { listDestinations, staticDestinations } from "../../../../db/destinations";
import {
  createLocalServiceItem,
  listLocalServiceItems,
  useLocalServiceItems,
} from "./local-dev-store";

function databaseWriteError(error: unknown) {
  console.error("Failed to write service item to database", error);
  return NextResponse.json(
    {
      error:
        "创建服务失败：数据库暂时连接不上。请检查 Vercel 的 DATABASE_URL 是否使用 Supabase 的 Transaction pooler / Session pooler 完整连接串。",
    },
    { status: 503 },
  );
}

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (useLocalServiceItems()) return NextResponse.json(listLocalServiceItems());
  try {
    return NextResponse.json(await listServiceItems(true));
  } catch (error) {
    console.error("Failed to load service items", error);
    return NextResponse.json(staticServiceItemRecords(), {
      headers: { "x-admin-data-source": "static-fallback" },
    });
  }
}
export async function POST(r: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await r.json();
  const destinationId = Number(b.destinationId);
  if (!Number.isInteger(destinationId) || destinationId <= 0)
    return NextResponse.json({ error: "请先选择有效的目的地。" }, { status: 400 });
  if (useLocalServiceItems()) {
    const destination = staticDestinations.find((item) => item.id === destinationId);
    const item = createLocalServiceItem({ ...b, destinationId, city: destination?.nameZh || b.city });
    return NextResponse.json({ id: item.id, slug: item.slug }, { status: 201 });
  }
  try {
    const destination = (await listDestinations(true)).find(
      (item) => item.id === destinationId && item.status !== "hidden" && item.useForServices,
    );
    if (!destination)
      return NextResponse.json({ error: "目的地不存在、已隐藏，或未开启“用于服务”。" }, { status: 400 });
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
    const templateType = b.templateType || (type === "交通接送" ? "transfer" : type === "私人包车" ? "route" : "experience");
    const isCar = type === "私人包车";
    const isJourney = ["当地体验", "城市体验", "一日路线", "海岛体验"].includes(type);
    const steps =
      isCar || isJourney
        ? []
        : [
            { title: "告诉我们行程", description: "提供日期、地点和同行人数" },
            { title: "确认安排", description: "顾问确认车辆、司机与接送时间" },
            { title: "轻松出发", description: "按约定时间与地点开始服务" },
          ];
    const routes: unknown[] = [];
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
      ? ["日期", "同行人数", "出发地点", "想去的地方", "特殊需求"]
      : isJourney
        ? ["计划日期", "同行人数", "接送地点", "特殊需求"]
        : ["计划日期", "出发地点", "目的地", "同行人数", "航班信息"];
    const x = await env.DB.prepare(
      "INSERT INTO service_items(slug,type,destination_id,city,category,category_id,template_type,display_order,name_zh,name_en,steps,route_section_title_zh,route_section_title_en,route_section_intro_zh,route_section_intro_en,routes,timeline,inquiry_fields,status)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
      .bind(
        slug,
        type,
        destination.id,
        destination.nameZh,
        b.category || "交通服务",
        Number(b.categoryId || 1),
        templateType,
        Number(b.displayOrder || 99),
        b.nameZh || "新服务",
        b.nameEn || "New service",
        JSON.stringify(steps),
        b.routeSectionTitleZh || (isCar ? "热门包车方案" : ""),
        b.routeSectionTitleEn || (isCar ? "Popular Private Car Routes" : ""),
        b.routeSectionIntroZh || (isCar ? "以下路线仅作参考，可根据您的时间与兴趣灵活调整。" : ""),
        b.routeSectionIntroEn || (isCar ? "These routes are examples and can be adjusted around your time and interests." : ""),
        JSON.stringify(routes),
        JSON.stringify(timeline),
        JSON.stringify(inquiryFields),
        "draft",
      )
      .run();
    return NextResponse.json({ id: x.meta.last_row_id, slug }, { status: 201 });
  } catch (error) {
    return databaseWriteError(error);
  }
}
