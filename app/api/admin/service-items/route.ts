/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  listServiceItems,
  staticServiceItemRecords,
} from "../../../../db/service-items";
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
  if (useLocalServiceItems()) {
    const item = createLocalServiceItem(b);
    return NextResponse.json({ id: item.id, slug: item.slug }, { status: 201 });
  }
  try {
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
    const routes = isCar
      ? [
        {
          name: "吉隆坡经典一日游",
          nameZh: "吉隆坡经典一日游",
          nameEn: "Kuala Lumpur Classic Day Tour",
          duration: "约 8 小时",
          tag: "首次到访",
          tags: ["首次到访", "经典路线"],
          description: "双子塔、独立广场与茨厂街",
          descriptionZh: "双子塔、独立广场与茨厂街",
          descriptionEn: "Twin Towers, Merdeka Square and Chinatown",
          stops: "双子塔 · 独立广场 · 茨厂街",
          visible: true,
          sortOrder: 1,
          image: "",
          nodes: [
            { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发", descriptionEn: "Depart from your hotel", image: "", stayTime: "" },
            { nameZh: "双子塔", nameEn: "Petronas Twin Towers", descriptionZh: "城市地标与拍照点", descriptionEn: "City landmark and photo stop", image: "", stayTime: "约45分钟" },
            { nameZh: "独立广场", nameEn: "Merdeka Square", descriptionZh: "历史建筑与城市广场", descriptionEn: "Historic buildings and city square", image: "", stayTime: "约45分钟" },
            { nameZh: "茨厂街", nameEn: "Petaling Street", descriptionZh: "街区散步与小吃", descriptionEn: "Street walk and local snacks", image: "", stayTime: "约1小时" },
          ],
        },
        {
          name: "黑风洞文化路线",
          nameZh: "黑风洞文化路线",
          nameEn: "Batu Caves Cultural Route",
          duration: "约 10 小时",
          tag: "家庭友好",
          tags: ["约10小时", "家庭友好"],
          description: "黑风洞、国家皇宫与城市地标",
          descriptionZh: "黑风洞、国家皇宫与城市地标",
          descriptionEn: "Batu Caves, National Palace and city landmarks",
          stops: "黑风洞 · 国家皇宫 · 城市地标",
          visible: true,
          sortOrder: 2,
          image: "",
          nodes: [
            { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发前往黑风洞", descriptionEn: "Depart from your hotel to Batu Caves", image: "", stayTime: "" },
            { nameZh: "黑风洞", nameEn: "Batu Caves", descriptionZh: "彩虹阶梯与印度教文化地标", descriptionEn: "Rainbow stairs and Hindu cultural landmark", image: "", stayTime: "约1.5小时" },
            { nameZh: "国家皇宫", nameEn: "National Palace", descriptionZh: "外观拍照，轻松停留", descriptionEn: "Photo stop outside the palace", image: "", stayTime: "约30分钟" },
            { nameZh: "返回酒店", nameEn: "Return", descriptionZh: "按约定时间返回酒店", descriptionEn: "Return to your hotel at the agreed time", image: "", stayTime: "" },
          ],
        },
        {
          name: "美食购物休闲路线",
          nameZh: "美食购物休闲路线",
          nameEn: "Food, Shopping & Leisure Route",
          duration: "约 6 小时",
          tag: "适合购物",
          tags: ["约6小时", "适合购物"],
          description: "武吉免登、Pavilion与当地美食",
          descriptionZh: "武吉免登、Pavilion与当地美食",
          descriptionEn: "Bukit Bintang, Pavilion and local food",
          stops: "武吉免登 · Pavilion · 本地美食",
          visible: true,
          sortOrder: 3,
          image: "",
          nodes: [
            { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发，安排轻松购物路线", descriptionEn: "Depart from your hotel for a relaxed shopping route", image: "", stayTime: "" },
            { nameZh: "武吉免登", nameEn: "Bukit Bintang", descriptionZh: "吉隆坡核心商圈，适合购物和逛街", descriptionEn: "Central shopping district in Kuala Lumpur", image: "", stayTime: "约2小时" },
            { nameZh: "Pavilion", nameEn: "Pavilion", descriptionZh: "商场休闲与品牌购物", descriptionEn: "Mall leisure and brand shopping", image: "", stayTime: "约1.5小时" },
            { nameZh: "本地美食", nameEn: "Local food", descriptionZh: "可按口味安排夜市、餐厅或咖啡馆", descriptionEn: "Night market, restaurant or cafe based on your taste", image: "", stayTime: "约1小时" },
          ],
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
      "INSERT INTO service_items(slug,type,destination_id,city,category,category_id,template_type,display_order,name_zh,name_en,steps,route_section_title_zh,route_section_title_en,route_section_intro_zh,route_section_intro_en,routes,timeline,inquiry_fields,status)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
      .bind(
        slug,
        type,
        Number(b.destinationId || 0),
        b.city || "吉隆坡",
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
