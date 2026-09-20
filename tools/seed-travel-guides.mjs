import dns from "node:dns";
import fs from "node:fs";
import postgres from "postgres";

dns.setDefaultResultOrder("ipv4first");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const sql = postgres(env.DATABASE_URL, { connect_timeout: 10, prepare: false, ssl: "require" });
const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=86`;

const guides = [
  ["first-time-kuala-lumpur", "第一次去吉隆坡，这几个地方值得慢慢逛", "Where to slow down on a first Kuala Lumpur trip", "kuala-lumpur", "城市漫游", "从现代城市地标到老街巷弄，感受吉隆坡的多元与活力。", "From modern landmarks to old lanes, feel the city's layered rhythm.", image("photo-1596422846543-75c6fc197f07"), "KUALA LUMPUR", 4, 1, 1, "published", JSON.stringify([{ type: "paragraph", text: "详情页视觉稿确认后，这里会承载完整攻略正文。" }])],
  ["kl-chinatown-slow-walk", "茨厂街不只适合打卡，傍晚去会更舒服", "A slower evening walk around Chinatown", "kuala-lumpur", "城市漫游", "老店、咖啡馆、街边小吃和夜色，是吉隆坡很有生活感的一面。", "Old shops, cafes, street snacks and evening light in one easy walk.", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Kuala_Lumpur._Jalan_Petaling._2019-12-07_15-24-13.jpg/1280px-Kuala_Lumpur._Jalan_Petaling._2019-12-07_15-24-13.jpg", "CHINATOWN", 3, 2, 0, "published", "[]"],
  ["kota-kinabalu-sunset", "亚庇看落日，时间比地点更重要", "For Kota Kinabalu sunsets, timing matters most", "kota-kinabalu", "行程参考", "把海边、晚餐和回程顺好，日落这件事就会变得很轻松。", "Line up the beach, dinner and return ride for an easier sunset.", image("photo-1507525428034-b723cf961d3e"), "SUNSET", 4, 1, 1, "published", "[]"],
  ["semporna-island-notes", "去仙本那跳岛前，先确认这几件小事", "Small checks before island hopping in Semporna", "semporna", "行程参考", "船班、天气、浮潜装备和接送时间，会直接影响当天体验。", "Boats, weather, gear and transfers shape how the sea day feels.", image("photo-1544550285-f813152fb2fd"), "ISLAND DAY", 5, 1, 1, "published", "[]"],
  ["melaka-one-day-walk", "马六甲一日慢走，别把行程排得太满", "Keep a Melaka day trip pleasantly light", "melaka", "城市漫游", "红屋、河畔和鸡场街之间留一点空白，古城才会好逛。", "Leave space between Dutch Square, the river and Jonker Street.", image("photo-1580537659466-0a9bfa916a54"), "MELAKA", 4, 1, 1, "published", "[]"],
];

await sql.begin(async (tx) => {
  await tx`
    insert into travel_guide_settings(id, hero_image, hero_title_zh, hero_title_en, hero_description_zh, hero_description_en, hero_script)
    values(1, ${image("photo-1596422846543-75c6fc197f07")}, ${"旅行攻略"}, ${"TRAVEL GUIDE"}, ${"用更慢的节奏，遇见更真实的马来西亚。"}, ${"Meet the real Malaysia at a slower pace."}, ${"More\nThan a Trip"})
    on conflict (id) do nothing
  `;
  for (const row of guides) {
    await tx`
      insert into travel_guide_articles(slug, title_zh, title_en, city, category, summary_zh, summary_en, cover_image, image_label, read_minutes, sort_order, featured, status, content_blocks)
      values(${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]}, ${row[7]}, ${row[8]}, ${row[9]}, ${row[10]}, ${row[11]}, ${row[12]}, ${row[13]})
      on conflict (slug) do nothing
    `;
  }
});

const guideCount = await sql`select count(*)::int as total from travel_guide_articles`;
const settingsCount = await sql`select count(*)::int as total from travel_guide_settings`;
console.log(JSON.stringify({ guides: guideCount[0].total, settings: settingsCount[0].total }));
await sql.end();
