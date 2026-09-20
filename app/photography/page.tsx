import { defaultGuideSettings, getTravelGuideSettings, listTravelGuides, staticTravelGuides } from "../../db/travel-guides";
import { withPublicDataTimeout } from "../../lib/public-data-timeout";
import { TravelGuidePage } from "./travel-guide-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const loadedArticles = await withPublicDataTimeout(
    listTravelGuides(),
    () => staticTravelGuides(),
    "Public travel guides query",
  );
  const settings = await withPublicDataTimeout(
    getTravelGuideSettings(),
    defaultGuideSettings,
    "Public travel guide settings query",
  );
  const articles = loadedArticles.length > 0 ? loadedArticles : staticTravelGuides();
  return <TravelGuidePage articles={articles} settings={settings} />;
}
