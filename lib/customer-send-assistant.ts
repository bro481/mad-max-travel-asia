import type { CustomerShareContent, CustomerShareProductType } from "../db/customer-shares";
import { resolveCustomerShareContent } from "./customer-share-content";

export type SendStage = "first" | "quoted" | "comparing" | "booking";
export type SendTone = "normal" | "shorter" | "warmer";

export type SendAssistantInput = {
  productType: CustomerShareProductType;
  productId: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  useDate?: string;
  people?: string;
  quoteText?: string;
  concerns?: string[];
  stage?: SendStage;
  context?: string;
  tone?: SendTone;
};

export type SendAssistantResult = {
  text: string;
  url: string;
  content: CustomerShareContent;
};

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function dateText(input: SendAssistantInput) {
  if (input.startDate && input.endDate) return `${input.startDate}—${input.endDate}`;
  return input.useDate || input.startDate || "";
}

function nights(input: SendAssistantInput) {
  if (!input.startDate || !input.endDate) return 0;
  const value = Math.round((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function moneyTotal(input: SendAssistantInput) {
  const quote = input.quoteText || "";
  const match = quote.match(/(?:RM|rm)?\s*([0-9]+(?:\.[0-9]+)?)/);
  const stayNights = nights(input);
  if (!match || !stayNights) return "";
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return "";
  return `住${stayNights}晚一共是RM${amount * stayNights}`;
}

function stageEnding(stage: SendStage) {
  if (stage === "quoted") return "如果这套您觉得合适，我再帮您确认您这个日期的房态和最终安排。";
  if (stage === "comparing") return "如果您还有另外一套正在比较，也可以一起发给我，我可以帮您简单对比一下位置、内容和价格。";
  if (stage === "booking") return "如果内容、日期和价格都没问题，我这边就可以继续帮您确认预订信息。";
  return "您先看看是不是自己喜欢的类型，有什么问题直接跟我说就可以，不着急。";
}

function introByStage(input: SendAssistantInput, content: CustomerShareContent) {
  const date = dateText(input);
  const people = input.people ? `${input.people}` : "";
  const target = compact([date, people ? `${people}的情况` : ""]).join("，");
  const name = input.customerName ? `${input.customerName}，` : "";
  if (input.stage === "quoted") return `${name}可以的～我刚刚按照${target || "您刚才说的需求"}帮您看了一下。`;
  if (input.stage === "comparing") return `${name}我按${target || "您的需求"}先把这项内容整理给您，方便您和其他选择一起比较。`;
  if (input.stage === "booking") return `${name}可以的～我把目前这项内容和您关心的信息整理一下，方便您最后确认。`;
  return `${name}可以的～我按照${target || "您的需求"}，给您看一下${content.type === "stay" ? "这套" : "这个安排"}。`;
}

function reasonLine(content: CustomerShareContent, input: SendAssistantInput) {
  const typeText =
    content.type === "stay"
      ? "房型"
      : content.type === "route"
        ? "路线"
        : content.type === "package"
          ? "套餐"
          : "服务";
  const suffix = content.subtitle ? `，${content.subtitle}` : "";
  if (input.stage === "booking") return `这项是「${content.title}」${suffix}。`;
  return `我比较推荐您看看「${content.title}」这个${typeText}${suffix}。`;
}

function relevantAdvantages(content: CustomerShareContent, concerns: string[]) {
  const facts = [...content.details.map((item) => `${item.label}：${item.value}`), ...content.highlights];
  if (!concerns.length) return facts.slice(0, 4);
  const scored = facts
    .map((fact) => ({
      fact,
      score: concerns.reduce((total, concern) => total + (fact.includes(concern) ? 2 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  const selected = scored.filter((item) => item.score > 0).map((item) => item.fact);
  return [...selected, ...facts.filter((fact) => !selected.includes(fact))].slice(0, 4);
}

function quoteLine(input: SendAssistantInput) {
  if (!input.quoteText) return "";
  const total = moneyTotal(input);
  return `您刚才关注价格，这个我这边可以按${input.quoteText}给您整理${total ? `，${total}` : ""}。`;
}

function detailsParagraph(content: CustomerShareContent, input: SendAssistantInput) {
  const advantages = relevantAdvantages(content, input.concerns || []);
  if (!advantages.length) return "";
  const lead = input.concerns?.length ? `结合您比较在意的${input.concerns.join("、")}，` : "";
  return `${lead}这项比较值得看的地方是：${advantages.join("；")}。`;
}

function linkLead(content: CustomerShareContent) {
  if (content.type === "stay") return "我把这个房型的详细页面发给您，里面可以看看房间照片、位置和具体设施👇";
  if (content.type === "route") return "我把这条路线的详细页面发给您，里面可以看看路线内容和停靠点👇";
  if (content.type === "package") return "我把这个套餐的详细页面发给您，里面可以看看行程安排和包含内容👇";
  return "我把这个服务的详细页面发给您，里面可以看看具体内容和安排方式👇";
}

export async function generateCustomerSendCopy(input: SendAssistantInput): Promise<SendAssistantResult | null> {
  const content = await resolveCustomerShareContent(input.productType, input.productId);
  if (!content) return null;
  const lines = compact([
    introByStage(input, content),
    reasonLine(content, input),
    input.context ? `您补充的情况我也一起参考了：${input.context}` : "",
    quoteLine(input),
    detailsParagraph(content, input),
    linkLead(content),
  ]);
  const ending = stageEnding(input.stage || "first");
  let text = [...lines, ending].join("\n\n");
  if (input.tone === "warmer") text = text.replace(/可以的/g, "可以的～").replace(/您先看看/g, "您先慢慢看看");
  if (input.tone === "shorter") {
    text = compact([introByStage(input, content), reasonLine(content, input), quoteLine(input), linkLead(content), ending]).join("\n\n");
  }
  return { text, url: content.url, content };
}
