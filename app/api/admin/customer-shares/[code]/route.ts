import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getCustomerShare, updateCustomerShare, type CustomerSharePayload, type CustomerShareStatus } from "../../../../../db/customer-shares";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const item = await getCustomerShare(code);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const body = (await request.json()) as { status?: CustomerShareStatus; payload?: CustomerSharePayload };
  const item = await updateCustomerShare(code, { status: body.status, payload: body.payload });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}
