const image = (id: string, width = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=86`;

export type AboutMoment = {
  id: string;
  image: string;
  captionZh: string;
  captionEn: string;
  size: "large" | "normal";
};

export type AboutWay = {
  id: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
};

export type AboutDestinationSetting = {
  destinationId: number;
  serviceSummaryZh: string;
  serviceSummaryEn: string;
  visible: boolean;
  sortOrder: number;
};

export type AboutSettings = {
  hero: {
    eyebrow: string;
    titleZh: string;
    titleEn: string;
    introZh: string;
    introEn: string;
    tagsZh: string[];
    tagsEn: string[];
    images: [string, string, string];
    imageBadgeZh: string;
    imageBadgeEn: string;
  };
  destinations: {
    visible: boolean;
    eyebrow: string;
    titleZh: string;
    titleEn: string;
    introZh: string;
    introEn: string;
    footerZh: string;
    footerEn: string;
    items: AboutDestinationSetting[];
  };
  ways: {
    visible: boolean;
    eyebrow: string;
    titleZh: string;
    titleEn: string;
    introZh: string;
    introEn: string;
    items: AboutWay[];
  };
  philosophy: {
    visible: boolean;
    eyebrow: string;
    titleZh: string;
    titleEn: string;
    sideTitleZh: string;
    sideTitleEn: string;
    paragraphsZh: string[];
    paragraphsEn: string[];
  };
  moments: {
    visible: boolean;
    eyebrow: string;
    titleZh: string;
    titleEn: string;
    introZh: string;
    introEn: string;
    items: AboutMoment[];
  };
  team: {
    visible: boolean;
    eyebrow: string;
    titleZh: string;
    titleEn: string;
    brandName: string;
    brandSubtitleZh: string;
    brandSubtitleEn: string;
    bodyZh: string;
    bodyEn: string;
    image: string;
    imageBadgeZh: string;
    imageBadgeEn: string;
    showWechat: boolean;
    showWhatsapp: boolean;
  };
  cta: {
    visible: boolean;
    titleZh: string;
    titleEn: string;
    descriptionZh: string;
    descriptionEn: string;
    primaryTextZh: string;
    primaryTextEn: string;
    secondaryTextZh: string;
    secondaryTextEn: string;
    secondaryLink: string;
  };
  status: "draft" | "published";
};

export type InquirySettings = {
  contacts: {
    wechatEnabled: boolean;
    wechatId: string;
    wechatName: string;
    wechatQr: string;
    whatsappEnabled: boolean;
    whatsappNumber: string;
    whatsappCountryCode: string;
    phone: string;
    email: string;
  };
  completion: {
    eyebrow: string;
    title: string;
    description: string;
    copyButton: string;
    backButton: string;
    footerHint: string;
  };
  copyRules: { sourcePrefix: string };
};

export const defaultAboutSettings: AboutSettings = {
  hero: {
    eyebrow: "MAD MAX · MALAYSIA LOCAL STAY",
    titleZh: "在马来西亚，\n像当地朋友一样帮你安排。",
    titleEn: "In Malaysia,\nhelping like a local friend.",
    introZh:
      "我们专注马来西亚住宿、出行与当地体验。从选房、接送、包车到旅途中的小事，都由熟悉当地的人帮你衔接安排。",
    introEn:
      "We help with stays, transport and local experiences across Malaysia — connecting the details with people who know the places on the ground.",
    tagsZh: ["中文沟通", "当地服务"],
    tagsEn: ["Chinese-speaking support", "Local service"],
    images: [
      image("photo-1549317661-bd32c8ce0db2"),
      image("photo-1544550285-f813152fb2fd"),
      image("photo-1600566753190-17f0baa2a6c3"),
    ],
    imageBadgeZh: "住宿 · 车辆 · 当地行程",
    imageBadgeEn: "Stays · vehicles · local journeys",
  },
  destinations: {
    visible: true,
    eyebrow: "MALAYSIA & BEYOND",
    titleZh: "我们服务的目的地",
    titleEn: "Destinations we serve",
    introZh: "这些是我们目前重点提供服务和衔接安排的地方。",
    introEn:
      "These are the places where we currently focus our service and trip coordination.",
    footerZh:
      "服务范围也覆盖马六甲、新加坡及其他周边路线，具体安排可提前咨询。",
    footerEn:
      "Our coverage also extends to Melaka, Singapore and other nearby routes. Ask us about specific arrangements.",
    items: [],
  },
  ways: {
    visible: true,
    eyebrow: "HOW WE HELP",
    titleZh: "我们平时，就是这样帮客人安排旅行",
    titleEn: "How we help guests every day",
    introZh:
      "不是把订单交给系统之后就结束，而是把住宿、交通和行程一点点接起来。",
    introEn:
      "Your order does not disappear into a system. We help connect the stay, transport and itinerary.",
    items: [
      { id: "way-1", titleZh: "帮客人选住宿", titleEn: "Find the right stay", descriptionZh: "根据人数、位置和行程，从现有房源里帮你找到更合适的一间。", descriptionEn: "We match your group, location and itinerary with a more suitable place to stay." },
      { id: "way-2", titleZh: "把交通接起来", titleEn: "Connect the transport", descriptionZh: "机场接送、包车和跨城行程可以一起安排，不需要自己分别找车。", descriptionEn: "Airport transfers, private cars and intercity journeys can be arranged together." },
      { id: "way-3", titleZh: "安排当地体验", titleEn: "Add local experiences", descriptionZh: "海岛、一日游、跟拍等项目，根据你的时间一起搭配。", descriptionEn: "Island trips, day tours and photography can be fitted around your time." },
      { id: "way-4", titleZh: "旅途中也找得到我们", titleEn: "Reach us during the trip", descriptionZh: "入住、车辆或行程临时有问题，也可以直接联系我们继续处理。", descriptionEn: "If something changes with your stay, vehicle or itinerary, you can contact us directly." },
    ],
  },
  philosophy: {
    visible: true,
    eyebrow: "A MORE PERSONAL WAY",
    titleZh: "为什么这里不是一个自动订房平台？",
    titleEn: "Why are we not an automated booking platform?",
    sideTitleZh: "我们更愿意先了解你的旅行。",
    sideTitleEn: "We would rather understand your trip first.",
    paragraphsZh: [
      "每个人的行程都不一样。有人带孩子，有人第一次来马来西亚，有人凌晨抵达，也有人想把住宿、包车和海岛行程一次安排好。",
      "所以这里不是一个下单后就结束的平台。你可以先告诉我们什么时候来、几个人、想怎么玩，我们再帮你把合适的住宿和当地服务安排到一起。",
    ],
    paragraphsEn: [
      "Every journey is different. Some guests travel with children, arrive after midnight or want to arrange their stay, private car and island trip together.",
      "Tell us when you are coming, who is travelling and what you would like to do. We will help connect a suitable stay with the local services around it.",
    ],
  },
  moments: {
    visible: true,
    eyebrow: "EVERYDAY MOMENTS",
    titleZh: "一些真实的日常",
    titleEn: "Some everyday moments",
    introZh:
      "房间、车辆、码头和行程确认——这些普通的小事，就是我们每天在做的事情。",
    introEn:
      "Rooms, vehicles, jetties and itinerary checks — the ordinary details are the work we do each day.",
    items: [
      ["photo-1600566753190-17f0baa2a6c3", "准备客人入住", "Preparing a guest stay"],
      ["photo-1549317661-bd32c8ce0db2", "确认接机车辆", "Confirming an airport transfer"],
      ["photo-1544550285-f813152fb2fd", "出发去码头", "Leaving for the jetty"],
      ["photo-1596422846543-75c6fc197f07", "吉隆坡的一天", "A day in Kuala Lumpur"],
      ["photo-1507525428034-b723cf961d3e", "安排海岛行程", "Planning an island day"],
    ].map(([id, captionZh, captionEn], index) => ({ id, image: image(id), captionZh, captionEn, size: index === 0 ? "large" as const : "normal" as const })),
  },
  team: {
    visible: true,
    eyebrow: "THE PEOPLE BEHIND THE SCREEN",
    titleZh: "屏幕另一边，是我们。",
    titleEn: "There are real people on the other side.",
    brandName: "MAD MAX Malaysia Stay",
    brandSubtitleZh: "马来西亚当地住宿与旅行服务",
    brandSubtitleEn: "Local stays and travel services in Malaysia",
    bodyZh:
      "我们每天做的事情其实很简单：帮客人找合适的住宿、确认入住、安排车辆，再把想去的地方一点点接起来。如果你第一次来马来西亚，不知道住哪里、怎么走、哪些项目适合自己，都可以直接来问我们。",
    bodyEn:
      "Our work is simple: find a suitable stay, confirm check-in, arrange the vehicle and connect the places you want to visit. If this is your first time in Malaysia, you can always ask us where to stay, how to travel or what might suit you.",
    image: image("photo-1550355291-bbee04a92027"),
    imageBadgeZh: "当地安排，直接沟通",
    imageBadgeEn: "Local planning, direct communication",
    showWechat: true,
    showWhatsapp: true,
  },
  cta: {
    visible: true,
    titleZh: "准备来马来西亚了吗？",
    titleEn: "Coming to Malaysia?",
    descriptionZh:
      "告诉我们什么时候来、几个人、想去哪里，剩下的我们一起慢慢安排。",
    descriptionEn:
      "Tell us when, who is travelling and where you would like to go. We can work out the rest together.",
    primaryTextZh: "开始咨询",
    primaryTextEn: "Start a conversation",
    secondaryTextZh: "看看我们的房源",
    secondaryTextEn: "See our stays",
    secondaryLink: "/#stays",
  },
  status: "published",
};

export const defaultInquirySettings: InquirySettings = {
  contacts: {
    wechatEnabled: true,
    wechatId: "MADMAX_STAY",
    wechatName: "MAD MAX Malaysia Stay",
    wechatQr: "",
    whatsappEnabled: true,
    whatsappNumber: "",
    whatsappCountryCode: "+60",
    phone: "",
    email: "",
  },
  completion: {
    eyebrow: "REQUEST READY",
    title: "需求整理好了",
    description: "我们会根据这些信息帮你确认具体安排。",
    copyButton: "复制需求并添加微信 →",
    backButton: "← 返回修改",
    footerHint: "添加微信后，把刚刚复制的需求发给我们即可。",
  },
  copyRules: { sourcePrefix: "官网咨询" },
};
