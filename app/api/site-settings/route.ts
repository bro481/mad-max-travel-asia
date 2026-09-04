import { NextResponse } from "next/server";
import {
  defaultAboutSettings,
  defaultInquirySettings,
} from "../../../db/site-settings";
import { readSiteSetting } from "../../../db/site-settings-store";

const cacheHeaders = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (key === "about")
    return NextResponse.json(await readSiteSetting("about", defaultAboutSettings), { headers: cacheHeaders });
  if (key === "inquiry")
    return NextResponse.json(await readSiteSetting("inquiry", defaultInquirySettings), { headers: cacheHeaders });
  return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
}
