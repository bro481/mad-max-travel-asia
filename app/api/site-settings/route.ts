import { NextResponse } from "next/server";
import {
  defaultAboutSettings,
  defaultInquirySettings,
} from "../../../db/site-settings";
import { readSiteSetting } from "../../../db/site-settings-store";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (key === "about")
    return NextResponse.json(
      await readSiteSetting("about", defaultAboutSettings),
    );
  if (key === "inquiry")
    return NextResponse.json(
      await readSiteSetting("inquiry", defaultInquirySettings),
    );
  return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
}
