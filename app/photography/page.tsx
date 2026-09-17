import { defaultGuideSettings, getTravelGuideSettings, listTravelGuides, staticTravelGuides } from "../../db/travel-guides";
import { withPublicDataTimeout } from "../../lib/public-data-timeout";
import { TravelGuidePage } from "./travel-guide-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [articles, settings] = await Promise.all([
    withPublicDataTimeout(listTravelGuides(), () => staticTravelGuides(), "Public travel guides query"),
    withPublicDataTimeout(getTravelGuideSettings(), defaultGuideSettings, "Public travel guide settings query"),
  ]);
  return <TravelGuidePage articles={articles} settings={settings} />;
}
