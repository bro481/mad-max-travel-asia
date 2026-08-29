import { env } from "cloudflare:workers";

export type ServiceCategory={id:number;slug:string;nameZh:string;nameEn:string;introZh:string;introEn:string;descriptionZh:string;descriptionEn:string;image:string;itemsZh:string[];itemsEn:string[];icon:string;sortOrder:number;visible:boolean;updatedAt:string};

const createSql=`CREATE TABLE IF NOT EXISTS service_categories (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name_zh TEXT NOT NULL, name_en TEXT NOT NULL,
 intro_zh TEXT NOT NULL DEFAULT '', intro_en TEXT NOT NULL DEFAULT '', description_zh TEXT NOT NULL DEFAULT '', description_en TEXT NOT NULL DEFAULT '',
 image TEXT NOT NULL DEFAULT '', items_zh TEXT NOT NULL DEFAULT '[]', items_en TEXT NOT NULL DEFAULT '[]', icon TEXT NOT NULL DEFAULT '✦',
 sort_order INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
export const serviceCategorySeeds=[
 ["transport","交通服务","Transport","接送、包车与跨城路线","Transfers, private cars and routes","机场抵达、城市包车和跨城市接送都归在这里。","Airport arrivals, private cars and intercity transfers live here.","https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=88",["机场接送","私人包车","跨城接送"],["Airport transfer","Private car","Intercity transfer"],"▱",1],
 ["island","海岛体验","Island Experience","海岛、浮潜与出海安排","Islands, snorkelling and boat trips","从亚庇到仙本那，安排适合家庭、朋友或情侣的海岛体验。","Island experiences around Kota Kinabalu and Semporna for families, friends and couples.","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=88",["美人鱼岛","环滩岛","跳岛体验"],["Mantanani Island","Mengalum Island","Island hopping"],"≈",2],
 ["nature","自然体验","Nature Experience","亲近自然，发现野生世界","Get closer to nature and wildlife","红树林、热带雨林与神山路线，用轻松节奏体验自然。","Mangroves, rainforest and Mount Kinabalu routes at a relaxed pace.","https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1400&q=88",["红树林探索","萤火虫之旅","神山自然体验"],["Mangrove exploration","Firefly tour","Mount Kinabalu nature experience"],"♧",3],
 ["city","城市体验","City Experience","城市文化、美食与轻路线","Culture, food and easy city routes","适合半日或一日的城市文化、美食与轻松探索。","Half-day or full-day culture, food and city discoveries.","https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=88",["城市漫游","文化体验","美食路线"],["City walk","Culture experience","Food route"],"⌖",4]
] as const;

export function staticServiceCategories(): ServiceCategory[] {
  return serviceCategorySeeds.map((seed, index) => ({
    id: index + 1,
    slug: seed[0],
    nameZh: seed[1],
    nameEn: seed[2],
    introZh: seed[3],
    introEn: seed[4],
    descriptionZh: seed[5],
    descriptionEn: seed[6],
    image: seed[7],
    itemsZh: [...seed[8]],
    itemsEn: [...seed[9]],
    icon: seed[10],
    sortOrder: seed[11],
    visible: true,
    updatedAt: "",
  }));
}

export async function ensureServices(){await env.DB.prepare(createSql).run();const row=await env.DB.prepare("SELECT COUNT(*) total FROM service_categories").first<{total:number}>();if((row?.total||0)>0)return;for(const s of serviceCategorySeeds)await env.DB.prepare(`INSERT INTO service_categories (slug,name_zh,name_en,intro_zh,intro_en,description_zh,description_en,image,items_zh,items_en,icon,sort_order,visible) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`).bind(s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],JSON.stringify(s[8]),JSON.stringify(s[9]),s[10],s[11]).run()}
const parse=(value:unknown)=>{try{return JSON.parse(String(value||"[]"))}catch{return []}};
export function mapService(row:Record<string,unknown>):ServiceCategory{return {id:Number(row.id),slug:String(row.slug),nameZh:String(row.name_zh),nameEn:String(row.name_en),introZh:String(row.intro_zh),introEn:String(row.intro_en),descriptionZh:String(row.description_zh),descriptionEn:String(row.description_en),image:String(row.image),itemsZh:parse(row.items_zh),itemsEn:parse(row.items_en),icon:String(row.icon),sortOrder:Number(row.sort_order),visible:Boolean(row.visible),updatedAt:String(row.updated_at)}}
export async function listServices(all=false){const result=await env.DB.prepare(`SELECT * FROM service_categories ${all?"":"WHERE visible=1"} ORDER BY sort_order,id`).all();return result.results.map(x=>mapService(x as Record<string,unknown>))}
export async function getService(slug:string){const row=await env.DB.prepare("SELECT * FROM service_categories WHERE slug=? AND visible=1").bind(slug).first();return row?mapService(row as Record<string,unknown>):null}
