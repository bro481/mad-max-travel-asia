import { defaultGuideSettings, getTravelGuideSettings, listTravelGuides, staticTravelGuides } from "../../db/travel-guides";
import { TravelGuidePage } from "./travel-guide-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  let articles = staticTravelGuides();
  let settings = defaultGuideSettings;
  try {
    [articles, settings] = await Promise.all([listTravelGuides(), getTravelGuideSettings()]);
  } catch (error) {
    console.error("Failed to load travel guides for public page", error);
  }
  return <TravelGuidePage articles={articles} settings={settings} />;
}
