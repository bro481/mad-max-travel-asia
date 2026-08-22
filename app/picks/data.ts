export type PriceType = "fixed" | "starting" | "reference" | "hidden";

export type PickProduct = {
  id: string;
  nameZh: string;
  nameEn: string;
  category: "drink" | "snack" | "gift";
  descriptionZh: string;
  descriptionEn: string;
  images: string[];
  tagZh: string;
  tagEn: string;
  price: number;
  priceType: PriceType;
  specsZh: string;
  specsEn: string;
  quantityZh: string;
  quantityEn: string;
  audienceZh: string;
  audienceEn: string;
  storageZh: string;
  storageEn: string;
  noteZh: string;
  noteEn: string;
  stockStatus: "available" | "preorder";
  sortOrder: number;
  visible: boolean;
};

export type PickBundle = {
  id: string;
  bundleNameZh: string;
  bundleNameEn: string;
  bundleImage: string;
  images: string[];
  includedProductsZh: string[];
  includedProductsEn: string[];
  price: number;
  descriptionZh: string;
  descriptionEn: string;
  scenarioZh: string;
  scenarioEn: string;
  visible: boolean;
  sortOrder: number;
};

const lifestyle = "https://www.papparich.net.au/media/slider/coffee-1800x1000.jpg";

export const products: PickProduct[] = [
  {
    id: "white-coffee", nameZh: "马来西亚白咖啡", nameEn: "Malaysian White Coffee", category: "drink",
    descriptionZh: "经典马来西亚味道，第一次不知道买什么可以从它开始。", descriptionEn: "A Malaysian classic and an easy place to start.",
    images: ["https://www.orientalkopi.asia/wp-content/uploads/2024/10/05c410b297290a4a428879097c144774-1024x937.jpg", lifestyle],
    tagZh: "第一次来推荐", tagEn: "Great first pick", price: 59, priceType: "starting",
    specsZh: "原味三合一，即冲即饮", specsEn: "Original 3-in-1 instant mix", quantityZh: "12 条 / 包，约 456g", quantityEn: "12 sachets, approx. 456g",
    audienceZh: "自用、同事、长辈", audienceEn: "Home, colleagues and family", storageZh: "置于阴凉干燥处", storageEn: "Store in a cool, dry place",
    noteZh: "不同甜度与包装以实际库存为准。", noteEn: "Sweetness and packaging depend on stock.", stockStatus: "available", sortOrder: 1, visible: true,
  },
  {
    id: "sabah-tea", nameZh: "沙巴茶", nameEn: "Sabah Tea", category: "drink",
    descriptionZh: "清香不涩，自己喝或者带回家送长辈都很合适。", descriptionEn: "Fragrant and smooth, lovely for home or as a gift for parents.",
    images: ["https://i.ebayimg.com/images/g/JWkAAOSwjIxlCTPp/s-l1200.jpg", "/malaysia-picks-hero-lifestyle-v2.png"],
    tagZh: "适合送长辈", tagEn: "For parents", price: 49, priceType: "starting",
    specsZh: "原味红茶茶包", specsEn: "Original black tea bags", quantityZh: "25 茶包 / 盒", quantityEn: "25 tea bags per box",
    audienceZh: "自己喝、送长辈、办公室分享", audienceEn: "Home, parents and office sharing", storageZh: "密封避光保存", storageEn: "Keep sealed and away from light",
    noteZh: "可提供礼袋，需提前说明。", noteEn: "Gift bags can be requested in advance.", stockStatus: "available", sortOrder: 2, visible: true,
  },
  {
    id: "durian-snack", nameZh: "榴莲零食", nameEn: "Durian Snacks", category: "snack",
    descriptionZh: "喜欢榴莲的基本不会错，独立包装也比较方便带。", descriptionEn: "A safe pick for durian lovers and easy to carry in small packs.",
    images: ["https://i.ebayimg.com/images/g/rXoAAOSwV3BnL5Wc/s-l1200.jpg", "https://down-id.img.susercontent.com/file/id-11134207-7qukw-lf135jucnlj239"],
    tagZh: "行李箱好带", tagEn: "Easy to pack", price: 55, priceType: "starting",
    specsZh: "冻干猫山王榴莲", specsEn: "Freeze-dried Musang King durian", quantityZh: "50g / 包", quantityEn: "50g per pack",
    audienceZh: "榴莲爱好者、朋友分享", audienceEn: "Durian lovers and sharing", storageZh: "开封后密封并尽快食用", storageEn: "Reseal and consume soon after opening",
    noteZh: "榴莲制品气味较浓，乘机携带请遵循航司规定。", noteEn: "Check airline rules before flying with durian products.", stockStatus: "preorder", sortOrder: 3, visible: true,
  },
  {
    id: "bak-kut-teh", nameZh: "肉骨茶料包", nameEn: "Bak Kut Teh Spice Pack", category: "gift",
    descriptionZh: "地道南洋风味，在家也能轻松煮肉骨茶。", descriptionEn: "An easy way to cook a warming Malaysian classic.",
    images: ["https://360mart.com.my/wp-content/uploads/2019/02/bak-kut-teh-600x600.jpg", "https://down-sg.img.susercontent.com/file/8991b65bcadaea3b9ff8249110ab5686"],
    tagZh: "在家也能煮", tagEn: "Cook at home", price: 35, priceType: "starting",
    specsZh: "香料与草本汤料包", specsEn: "Herbal soup spice mix", quantityZh: "35g / 包，约 4 人份", quantityEn: "35g, about four servings",
    audienceZh: "喜欢下厨、家庭分享", audienceEn: "Home cooks and families", storageZh: "阴凉干燥处密封保存", storageEn: "Keep sealed in a cool, dry place",
    noteZh: "建议搭配排骨、蒜头与豆腐泡烹煮。", noteEn: "Best cooked with ribs, garlic and tofu puffs.", stockStatus: "available", sortOrder: 4, visible: true,
  },
  {
    id: "chocolate", nameZh: "马来西亚巧克力", nameEn: "Malaysian Chocolate", category: "snack",
    descriptionZh: "口味好接受，带给小朋友或者放在办公室分享都合适。", descriptionEn: "Easy to enjoy and ideal for children or sharing at the office.",
    images: ["https://www.seingayhar.com/image/cache/catalog/Product/Chocolate/22-1000x1000.jpg", "/malaysia-picks-hero-lifestyle-v2.png"],
    tagZh: "小朋友喜欢", tagEn: "Family friendly", price: 32, priceType: "starting",
    specsZh: "牛奶巧克力 / 坚果巧克力", specsEn: "Milk or nut chocolate", quantityZh: "85–150g / 份", quantityEn: "85–150g per pack",
    audienceZh: "朋友、同事、家庭", audienceEn: "Friends, colleagues and family", storageZh: "避免高温和阳光直射", storageEn: "Avoid heat and direct sunlight",
    noteZh: "含乳制品或坚果，过敏人士请先确认配料。", noteEn: "May contain dairy or nuts; check ingredients for allergies.", stockStatus: "available", sortOrder: 5, visible: true,
  },
  {
    id: "gift-set", nameZh: "白咖啡伴手礼盒", nameEn: "White Coffee Gift Box", category: "gift",
    descriptionZh: "包装体面的一盒白咖啡，送朋友或者带去办公室都比较省心。", descriptionEn: "A presentable box of white coffee for friends or the office.",
    images: ["https://www.papparich.net.au/media/slider/coffee-1800x1000.jpg", "https://i.ebayimg.com/images/g/JWkAAOSwjIxlCTPp/s-l1200.jpg"],
    tagZh: "老客常回购", tagEn: "Repeat favourite", price: 128, priceType: "starting",
    specsZh: "白咖啡礼盒", specsEn: "White coffee gift box", quantityZh: "1 礼盒", quantityEn: "One gift box",
    audienceZh: "亲友、同事、商务送礼", audienceEn: "Family, colleagues and business gifts", storageZh: "按盒内各商品说明保存", storageEn: "Follow each product's storage guide",
    noteZh: "组合内容会根据预算与库存调整。", noteEn: "Contents can flex with budget and stock.", stockStatus: "preorder", sortOrder: 6, visible: true,
  },
];

export const bundles: PickBundle[] = [
  { id: "taster", bundleNameZh: "马来西亚尝鲜组合", bundleNameEn: "Malaysia Taster Set", bundleImage: products[0].images[0], images: [products[0].images[0], products[2].images[0], products[3].images[0]], includedProductsZh: ["白咖啡", "榴莲零食", "肉骨茶料包"], includedProductsEn: ["White coffee", "Durian snack", "Bak kut teh pack"], price: 129, descriptionZh: "第一次不知道买什么，选这套比较省心。", descriptionEn: "An easy set when you are not sure where to start.", scenarioZh: "第一次推荐", scenarioEn: "Great first choice", visible: true, sortOrder: 1 },
  { id: "family", bundleNameZh: "家庭伴手礼组合", bundleNameEn: "Family Gift Set", bundleImage: products[1].images[0], images: [products[1].images[0], products[0].images[0], products[2].images[0]], includedProductsZh: ["白咖啡", "沙巴茶", "榴莲零食", "特色小食"], includedProductsEn: ["White coffee", "Sabah tea", "Durian snack", "Local bites"], price: 199, descriptionZh: "适合带回家和家人一起分享。", descriptionEn: "Made for sharing with family back home.", scenarioZh: "带回家最省心", scenarioEn: "Easy family gifting", visible: true, sortOrder: 2 },
  { id: "office", bundleNameZh: "办公室分享组合", bundleNameEn: "Office Sharing Set", bundleImage: products[4].images[0], images: [products[4].images[0], products[0].images[0], "/malaysia-picks-hero-lifestyle-v2.png"], includedProductsZh: ["白咖啡", "巧克力", "小包装零食"], includedProductsEn: ["White coffee", "Chocolate", "Small snacks"], price: 299, descriptionZh: "份量更充足，适合带给同事朋友。", descriptionEn: "A generous set for colleagues and friends.", scenarioZh: "适合多人分享", scenarioEn: "Made for sharing", visible: true, sortOrder: 3 },
];
