import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  defaultAboutSettings,
  defaultInquirySettings,
} from "../../../../db/site-settings";
import { readSiteSetting, writeSiteSetting } from "../../../../db/site-settings-store";
import { revalidatePublicContent } from "../../../../lib/revalidate-public-content";

const defaults = { about: defaultAboutSettings, inquiry: defaultInquirySettings };

export async function GET(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key") as keyof typeof defaults;
  if (!defaults[key])
    return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
  return NextResponse.json(await readSiteSetting(key, defaults[key]));
}

export async function PUT(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key") as keyof typeof defaults;
  if (!defaults[key])
    return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
  try {
    const value = await request.json();
    await writeSiteSetting(key, value);
    revalidatePublicContent("settings");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save site settings", error);
    return NextResponse.json({ error: "保存失败，请重试" }, { status: 503 });
  }
}
