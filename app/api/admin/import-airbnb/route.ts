import {env} from "cloudflare:workers";import {NextResponse} from "next/server";import {getChatGPTUser} from "../../../chatgpt-auth";

export async function POST(request:Request){
 if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});
 const {url}=await request.json() as {url?:string};let target:URL;
 try{target=new URL(url||"")}catch{return NextResponse.json({error:"链接格式不正确"},{status:400})}
 if(target.protocol!=="https:"||!/(^|\.)airbnb\.[a-z.]+$/i.test(target.hostname))return NextResponse.json({error:"请输入 Airbnb 房源链接"},{status:400});
 const roomId=target.pathname.match(/\/rooms\/(\d+)/)?.[1];if(!roomId)return NextResponse.json({error:"链接中没有找到 Airbnb 房源编号"},{status:400});
 const response=await fetch(`https://www.airbnb.com/rooms/${roomId}`,{headers:{"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36","Accept-Language":"en-US,en;q=0.9"},redirect:"follow"});
 if(!response.ok)return NextResponse.json({error:"Airbnb 暂时阻止了页面读取，请稍后重试或使用本地批量上传"},{status:422});
 const html=(await response.text()).replace(/\\u002F/g,"/").replace(/\\u0026/g,"&").replace(/&amp;/g,"&");
 const pattern=new RegExp(`https://a0\\.muscache\\.com/im/pictures/(?:miso/)?Hosting-${roomId}/original/[^"'\\\\\\s?]+`,"gi");
 const originals=[...new Set([...html.matchAll(pattern)].map(x=>x[0]))].slice(0,50);
 const urls:string[]=[];
 for(const src of originals){try{const imageResponse=await fetch(`${src}?im_w=1440`,{headers:{"Referer":target.origin+"/","User-Agent":"Mozilla/5.0","Accept":"image/avif,image/webp,image/*,*/*"}});if(!imageResponse.ok)continue;const type=(imageResponse.headers.get("content-type")||"").split(";")[0];if(!type.startsWith("image/"))continue;const suffix=type.includes("png")?"png":type.includes("webp")?"webp":type.includes("avif")?"avif":"jpg";const key=`properties/${crypto.randomUUID()}.${suffix}`;await env.IMAGES.put(key,await imageResponse.arrayBuffer(),{httpMetadata:{contentType:type},customMetadata:{source:"airbnb",roomId}});urls.push(`/api/media/${key}`)}catch{}}
 if(!originals.length)return NextResponse.json({error:"Airbnb 页面没有返回该房源的公开图片，可能需要登录或页面受到地区限制"},{status:422});
 if(!urls.length)return NextResponse.json({error:`识别到 ${originals.length} 张图片，但 Airbnb 图片服务器拒绝下载，请稍后重试`},{status:422});
 return NextResponse.json({urls,detected:originals.length});
}
