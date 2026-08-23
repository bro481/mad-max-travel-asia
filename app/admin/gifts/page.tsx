"use client";

import Link from "next/link";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { bundles as pickBundles, products as pickProducts } from "../../picks/data";

type GiftTab = "商品列表" | "商品分类" | "精选组合" | "领取与寄送" | "页面设置";
type ProductStep = "基础信息" | "图片" | "规格与价格" | "商品说明" | "获取方式" | "发布";
type Status = "草稿" | "已上线" | "已隐藏";

type GiftCategory = { id: string; nameZh: string; nameEn: string; sortOrder: number; status: "显示" | "隐藏" };
type GiftSpec = { id: string; name: string; price: number; available: boolean };
type GiftProduct = {
  id: string; nameZh: string; nameEn: string; categoryId: string; shortIntro: string; recommendationTag: string;
  images: string[]; specs: GiftSpec[]; suitableFor: string; simpleDescription: string; usageNote: string; extraNote: string;
  useDefaultDelivery: boolean; obtainMethods: string[]; giftBag: boolean; giftBagNote: string; pickupRegions: string[];
  status: Status; sortOrder: number;
};
type GiftBundle = {
  id: string; nameZh: string; nameEn: string; recommendationTag: string; intro: string; coverImage: string;
  items: { productId: string; quantity: number }[]; price: number; useDefaultDelivery: boolean; status: Status; sortOrder: number;
};
type GiftSettings = {
  travelTitle: string; travelDescription: string; travelButton: string; shippingTitle: string; shippingDescription: string;
  shippingButton: string; shippingNote: string; giftBagDefault: boolean; giftBagNote: string; heroTitle: string; heroTitleEn: string;
  heroSubtitle: string; heroDescription: string; heroImage: string; sellingPoints: { title: string; text: string }[];
  helperTitle: string; helperDescription: string; helperButton: string;
};

const STORAGE_KEY = "mad-max-gift-admin-v1";
const tabs: GiftTab[] = ["商品列表", "商品分类", "精选组合", "领取与寄送", "页面设置"];
const productSteps: ProductStep[] = ["基础信息", "图片", "规格与价格", "商品说明", "获取方式", "发布"];
const obtainOptions = ["住宿期间领取", "接送期间领取", "包车 / 行程期间领取", "马来西亚境内配送", "回国后可咨询寄送"];
const pickupRegionOptions = ["不限地区", "吉隆坡", "亚庇", "仙本那"];

const seedCategories: GiftCategory[] = [
  { id: "drink", nameZh: "咖啡茶饮", nameEn: "Coffee & Tea", sortOrder: 1, status: "显示" },
  { id: "snack", nameZh: "零食", nameEn: "Snacks", sortOrder: 2, status: "显示" },
  { id: "gift", nameZh: "伴手礼", nameEn: "Gifts", sortOrder: 3, status: "显示" },
];

const seedProducts: GiftProduct[] = pickProducts.map((item) => ({
  id: item.id,
  nameZh: item.nameZh,
  nameEn: item.nameEn,
  categoryId: item.category,
  shortIntro: item.descriptionZh,
  recommendationTag: item.tagZh,
  images: item.images,
  specs: [{ id: `${item.id}-spec-1`, name: item.quantityZh || item.specsZh || "标准规格", price: item.price, available: true }],
  suitableFor: item.audienceZh,
  simpleDescription: item.descriptionZh,
  usageNote: item.specsZh,
  extraNote: item.noteZh,
  useDefaultDelivery: true,
  obtainMethods: ["住宿期间领取", "接送期间领取", "包车 / 行程期间领取", "回国后可咨询寄送"],
  giftBag: item.noteZh.includes("礼袋"),
  giftBagNote: "如需送人，可提前告诉我们。",
  pickupRegions: ["不限地区"],
  status: item.visible ? "已上线" : "草稿",
  sortOrder: item.sortOrder,
}));

const seedBundles: GiftBundle[] = pickBundles.map((item, index) => ({
  id: item.id,
  nameZh: item.bundleNameZh,
  nameEn: item.bundleNameEn,
  recommendationTag: item.scenarioZh,
  intro: item.descriptionZh,
  coverImage: item.bundleImage,
  items: item.includedProductsZh.map((_, itemIndex) => ({ productId: seedProducts[(index + itemIndex) % seedProducts.length]?.id ?? "white-coffee", quantity: 1 })),
  price: item.price,
  useDefaultDelivery: true,
  status: item.visible ? "已上线" : "草稿",
  sortOrder: item.sortOrder,
}));

const seedSettings: GiftSettings = {
  travelTitle: "还在马来西亚？",
  travelDescription: "提前告诉我们想要什么，可以结合住宿、接送或行程一起交给你。",
  travelButton: "旅途中领取",
  shippingTitle: "已经回国？",
  shippingDescription: "也没关系，告诉我们想要的商品和数量，我们再帮你确认寄送方式和费用。",
  shippingButton: "咨询寄送",
  shippingNote: "跨境寄送以目的地及实际承运要求为准。",
  giftBagDefault: true,
  giftBagNote: "需要送人？可以提前告诉我们是否需要礼袋。",
  heroTitle: "马来西亚好物",
  heroTitleEn: "Malaysia Picks",
  heroSubtitle: "带一点当地味道回家。",
  heroDescription: "我们在当地帮你挑选值得带走、适合送人，也值得再次回购的马来西亚好物。",
  heroImage: "/malaysia-picks-hero-lifestyle-v2.png",
  sellingPoints: [
    { title: "当地精选", text: "帮你筛掉不好选的" },
    { title: "价格透明", text: "商品价格提前确认" },
    { title: "旅行可取 · 回国可寄", text: "根据你的情况安排" },
  ],
  helperTitle: "不知道买什么？告诉我们送给谁。",
  helperDescription: "自己吃、送家人、送朋友还是办公室分享，我们可以直接帮你搭一套。",
  helperButton: "帮我挑一套",
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function priceLabel(specs: GiftSpec[]) {
  const available = specs.filter((spec) => spec.available);
  if (!available.length) return "价格咨询";
  const min = Math.min(...available.map((spec) => Number(spec.price) || 0));
  return `¥${min}${available.length > 1 ? " 起" : ""}`;
}

function cloneProduct(product: GiftProduct): GiftProduct {
  return { ...product, id: uid("gift"), nameZh: `${product.nameZh} - 副本`, nameEn: `${product.nameEn} Copy`, status: "草稿", sortOrder: product.sortOrder + 1, specs: product.specs.map((spec) => ({ ...spec, id: uid("spec") })) };
}

export default function GiftsAdminPage() {
  const [tab, setTab] = useState<GiftTab>("商品列表");
  const [categories, setCategories] = useState<GiftCategory[]>(seedCategories);
  const [products, setProducts] = useState<GiftProduct[]>(seedProducts);
  const [bundles, setBundles] = useState<GiftBundle[]>(seedBundles);
  const [settings, setSettings] = useState<GiftSettings>(seedSettings);
  const [editingProduct, setEditingProduct] = useState<GiftProduct | null>(null);
  const [productStep, setProductStep] = useState<ProductStep>("基础信息");
  const [editingCategory, setEditingCategory] = useState<GiftCategory | null>(null);
  const [editingBundle, setEditingBundle] = useState<GiftBundle | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      window.requestAnimationFrame(() => {
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.bundles) setBundles(parsed.bundles);
        if (parsed.settings) setSettings(parsed.settings);
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, products, bundles, settings }));
  }, [categories, products, bundles, settings]);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.sortOrder - b.sortOrder), [products]);
  const sortedBundles = useMemo(() => [...bundles].sort((a, b) => a.sortOrder - b.sortOrder), [bundles]);

  const openNewProduct = () => {
    setEditingProduct({
      id: uid("gift"),
      nameZh: "新商品",
      nameEn: "New Product",
      categoryId: categories[0]?.id ?? "drink",
      shortIntro: "",
      recommendationTag: "",
      images: [],
      specs: [{ id: uid("spec"), name: "标准规格", price: 0, available: true }],
      suitableFor: "",
      simpleDescription: "",
      usageNote: "",
      extraNote: "",
      useDefaultDelivery: true,
      obtainMethods: ["住宿期间领取", "接送期间领取"],
      giftBag: settings.giftBagDefault,
      giftBagNote: settings.giftBagNote,
      pickupRegions: ["不限地区"],
      status: "草稿",
      sortOrder: products.length + 1,
    });
    setProductStep("基础信息");
  };

  const saveProduct = () => {
    if (!editingProduct) return;
    setProducts((current) => current.some((item) => item.id === editingProduct.id) ? current.map((item) => item.id === editingProduct.id ? editingProduct : item) : [...current, editingProduct]);
    setMessage("商品已保存，本地预览数据已更新。");
  };

  const handleProductImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !editingProduct) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.append("files", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.urls)) uploaded.push(...data.urls);
      }
    }
    setEditingProduct({ ...editingProduct, images: [...editingProduct.images, ...uploaded] });
    setUploading(false);
    event.target.value = "";
  };

  const saveCategory = () => {
    if (!editingCategory) return;
    setCategories((current) => current.some((item) => item.id === editingCategory.id) ? current.map((item) => item.id === editingCategory.id ? editingCategory : item) : [...current, editingCategory]);
    setEditingCategory(null);
    setMessage("商品分类已保存。");
  };

  const saveBundle = () => {
    if (!editingBundle) return;
    setBundles((current) => current.some((item) => item.id === editingBundle.id) ? current.map((item) => item.id === editingBundle.id ? editingBundle : item) : [...current, editingBundle]);
    setEditingBundle(null);
    setMessage("精选组合已保存。");
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if (!editingProduct) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= editingProduct.images.length) return;
    const images = [...editingProduct.images];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    setEditingProduct({ ...editingProduct, images });
  };

  const setCover = (index: number) => {
    if (!editingProduct) return;
    const images = [...editingProduct.images];
    const [cover] = images.splice(index, 1);
    if (cover) setEditingProduct({ ...editingProduct, images: [cover, ...images] });
  };

  return <>
    <div className="admin-head">
      <div><p>当地服务 · 伴手礼</p><h1>伴手礼后台</h1><span>轻商品展示后台：只维护商品、分类、组合、获取方式和页面文案。</span></div>
      {(tab === "商品列表" || tab === "商品分类" || tab === "精选组合") && <button className="admin-primary" onClick={tab === "商品分类" ? () => setEditingCategory({ id: uid("cat"), nameZh: "新分类", nameEn: "New Category", sortOrder: categories.length + 1, status: "显示" }) : tab === "精选组合" ? () => setEditingBundle({ id: uid("bundle"), nameZh: "新组合", nameEn: "New Bundle", recommendationTag: "", intro: "", coverImage: "", items: [], price: 0, useDefaultDelivery: true, status: "草稿", sortOrder: bundles.length + 1 }) : openNewProduct}>＋ {tab === "商品分类" ? "新增分类" : tab === "精选组合" ? "新增组合" : "新建商品"}</button>}
    </div>

    <div className="service-subnav"><Link href="/admin/services">服务列表</Link><Link className="active" href="/admin/gifts">伴手礼</Link></div>
    <div className="gift-admin-tabs">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {message && <div className="gift-admin-message">{message}<button onClick={() => setMessage("")}>×</button></div>}

    {tab === "商品列表" && <section className="gift-admin-card">
      <div className="gift-admin-card-head"><div><h2>商品列表</h2><p>商品名称左侧是封面缩略图；规格最低价自动生成“¥xx 起”。</p></div><span>{products.length} 个商品</span></div>
      <div className="gift-product-table">
        <div className="gift-product-row header"><span>商品</span><span>分类</span><span>价格</span><span>获取方式</span><span>状态</span><span>排序</span><span>操作</span></div>
        {sortedProducts.map((product) => <div className="gift-product-row" key={product.id}>
          <div className="gift-product-name">{product.images[0] ? <img src={product.images[0]} alt="" /> : <i>暂无图</i>}<div><b>{product.nameZh}</b><small>{product.shortIntro || "还没有卡片短介绍"}</small></div></div>
          <span>{categoryMap.get(product.categoryId)?.nameZh ?? product.categoryId}</span>
          <b>{priceLabel(product.specs)}</b>
          <small>{product.useDefaultDelivery ? "使用默认规则" : product.obtainMethods.slice(0, 2).join(" / ")}</small>
          <em className={product.status === "已上线" ? "online" : ""}>{product.status}</em>
          <span>{product.sortOrder}</span>
          <nav><button onClick={() => { setEditingProduct(product); setProductStep("基础信息"); }}>编辑</button><button onClick={() => { setEditingProduct(product); setProductStep("图片"); }}>预览</button><button onClick={() => { const copy = cloneProduct(product); setProducts((current) => [...current, copy]); setEditingProduct(copy); setMessage("已复制商品，新副本为草稿。"); }}>复制</button><button onClick={() => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, status: "已隐藏" } : item))}>隐藏</button></nav>
        </div>)}
      </div>
    </section>}

    {tab === "商品分类" && <section className="gift-admin-card">
      <div className="gift-admin-card-head"><div><h2>商品分类</h2><p>控制前台“咖啡茶饮 / 零食 / 伴手礼”等筛选，不写死在前端。</p></div></div>
      <div className="gift-simple-table">{[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map((category) => <article key={category.id}><b>{category.sortOrder}</b><div><h3>{category.nameZh}</h3><p>{category.nameEn}</p></div><span>{products.filter((item) => item.categoryId === category.id).length} 个商品</span><em>{category.status}</em><button onClick={() => setEditingCategory(category)}>编辑</button><button onClick={() => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, status: item.status === "显示" ? "隐藏" : "显示" } : item))}>{category.status === "显示" ? "隐藏" : "显示"}</button></article>)}</div>
    </section>}

    {tab === "精选组合" && <section className="gift-admin-card">
      <div className="gift-admin-card-head"><div><h2>精选组合</h2><p>组合不是普通分类，而是由已有单品组合出来的“懒得挑”方案。</p></div></div>
      <div className="gift-bundle-grid">{sortedBundles.map((bundle) => <article key={bundle.id}><div>{bundle.coverImage ? <img src={bundle.coverImage} alt="" /> : <span>组合图</span>}</div><h3>{bundle.nameZh}</h3><p>{bundle.intro}</p><small>包含 {bundle.items.reduce((sum, item) => sum + item.quantity, 0)} 件 · ¥{bundle.price}</small><nav><button onClick={() => setEditingBundle(bundle)}>编辑</button><button onClick={() => setEditingBundle({ ...bundle, id: uid("bundle"), nameZh: `${bundle.nameZh} - 副本`, status: "草稿" })}>复制</button><button onClick={() => setBundles((current) => current.map((item) => item.id === bundle.id ? { ...item, status: "已隐藏" } : item))}>隐藏</button></nav></article>)}</div>
    </section>}

    {tab === "领取与寄送" && <SettingsPanel title="领取与寄送" description="这里管理全站默认获取规则，单个商品通常直接继承。" onSave={() => setMessage("领取与寄送设置已保存。")}>
      <div className="gift-two-column">
        <Field label="旅途中领取标题" value={settings.travelTitle} onChange={(value) => setSettings({ ...settings, travelTitle: value })} />
        <Field label="旅途中领取按钮" value={settings.travelButton} onChange={(value) => setSettings({ ...settings, travelButton: value })} />
        <Field wide label="旅途中领取说明" value={settings.travelDescription} onChange={(value) => setSettings({ ...settings, travelDescription: value })} />
        <Field label="寄送标题" value={settings.shippingTitle} onChange={(value) => setSettings({ ...settings, shippingTitle: value })} />
        <Field label="寄送按钮" value={settings.shippingButton} onChange={(value) => setSettings({ ...settings, shippingButton: value })} />
        <Field wide label="寄送说明" value={settings.shippingDescription} onChange={(value) => setSettings({ ...settings, shippingDescription: value })} />
        <Field wide label="寄送补充说明" value={settings.shippingNote} onChange={(value) => setSettings({ ...settings, shippingNote: value })} />
        <label className="gift-check"><input type="checkbox" checked={settings.giftBagDefault} onChange={(event) => setSettings({ ...settings, giftBagDefault: event.target.checked })} /> 默认支持礼袋</label>
        <Field wide label="礼袋默认说明" value={settings.giftBagNote} onChange={(value) => setSettings({ ...settings, giftBagNote: value })} />
      </div>
    </SettingsPanel>}

    {tab === "页面设置" && <SettingsPanel title="页面设置" description="控制好物页面 Hero、三个卖点和底部“帮我挑一套”。" onSave={() => setMessage("页面设置已保存。")}>
      <div className="gift-two-column">
        <Field label="中文标题" value={settings.heroTitle} onChange={(value) => setSettings({ ...settings, heroTitle: value })} />
        <Field label="英文标题" value={settings.heroTitleEn} onChange={(value) => setSettings({ ...settings, heroTitleEn: value })} />
        <Field wide label="副标题" value={settings.heroSubtitle} onChange={(value) => setSettings({ ...settings, heroSubtitle: value })} />
        <Field wide textarea label="说明" value={settings.heroDescription} onChange={(value) => setSettings({ ...settings, heroDescription: value })} />
        <Field wide label="Hero 图片" value={settings.heroImage} onChange={(value) => setSettings({ ...settings, heroImage: value })} />
      </div>
      <h3>三个卖点</h3>
      <div className="gift-selling-grid">{settings.sellingPoints.map((point, index) => <article key={index}><Field label={`卖点 ${index + 1}`} value={point.title} onChange={(value) => setSettings({ ...settings, sellingPoints: settings.sellingPoints.map((item, itemIndex) => itemIndex === index ? { ...item, title: value } : item) })} /><Field label="说明" value={point.text} onChange={(value) => setSettings({ ...settings, sellingPoints: settings.sellingPoints.map((item, itemIndex) => itemIndex === index ? { ...item, text: value } : item) })} /></article>)}</div>
      <h3>挑选帮助</h3>
      <div className="gift-two-column"><Field label="标题" value={settings.helperTitle} onChange={(value) => setSettings({ ...settings, helperTitle: value })} /><Field label="按钮" value={settings.helperButton} onChange={(value) => setSettings({ ...settings, helperButton: value })} /><Field wide label="说明" value={settings.helperDescription} onChange={(value) => setSettings({ ...settings, helperDescription: value })} /></div>
    </SettingsPanel>}

    {editingProduct && <ProductEditor product={editingProduct} setProduct={setEditingProduct} step={productStep} setStep={setProductStep} categories={categories} categoryMap={categoryMap} uploading={uploading} onUpload={handleProductImageUpload} onSave={saveProduct} onClose={() => setEditingProduct(null)} moveImage={moveImage} setCover={setCover} settings={settings} />}
    {editingCategory && <CategoryModal category={editingCategory} setCategory={setEditingCategory} onSave={saveCategory} onClose={() => setEditingCategory(null)} />}
    {editingBundle && <BundleModal bundle={editingBundle} setBundle={setEditingBundle} products={products} onSave={saveBundle} onClose={() => setEditingBundle(null)} />}
  </>;
}

function ProductEditor({ product, setProduct, step, setStep, categories, categoryMap, uploading, onUpload, onSave, onClose, moveImage, setCover, settings }: { product: GiftProduct; setProduct: (product: GiftProduct) => void; step: ProductStep; setStep: (step: ProductStep) => void; categories: GiftCategory[]; categoryMap: Map<string, GiftCategory>; uploading: boolean; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onSave: () => void; onClose: () => void; moveImage: (index: number, direction: -1 | 1) => void; setCover: (index: number) => void; settings: GiftSettings }) {
  return <div className="gift-modal" onClick={onClose}><div className="gift-product-editor" onClick={(event) => event.stopPropagation()}>
    <header><div><p>商品编辑</p><h2>{product.nameZh}</h2><span>{categoryMap.get(product.categoryId)?.nameZh} · {product.status}</span></div><button onClick={onClose}>×</button></header>
    <div className="gift-editor-layout">
      <aside>{productSteps.map((item) => <button key={item} className={step === item ? "active" : ""} onClick={() => setStep(item)}><b>{productSteps.indexOf(item) + 1}</b>{item}</button>)}</aside>
      <main>
        {step === "基础信息" && <div className="gift-two-column"><label><span>分类</span><select value={product.categoryId} onChange={(event) => setProduct({ ...product, categoryId: event.target.value })}>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameZh}</option>)}</select></label><Field label="推荐标签（前台只显示一个）" value={product.recommendationTag} onChange={(value) => setProduct({ ...product, recommendationTag: value })} /><Field label="中文名称" value={product.nameZh} onChange={(value) => setProduct({ ...product, nameZh: value })} /><Field label="英文名称" value={product.nameEn} onChange={(value) => setProduct({ ...product, nameEn: value })} /><Field wide textarea label="卡片短介绍" value={product.shortIntro} onChange={(value) => setProduct({ ...product, shortIntro: value })} /></div>}
        {step === "图片" && <div><label className="gift-upload"><input type="file" multiple accept="image/*" onChange={onUpload} /><span>{uploading ? "上传中..." : "＋ 上传商品图片"}</span></label><p className="gift-hint">第一张图片作为列表封面和详情弹窗初始图片；支持设为封面、排序和删除。</p><div className="gift-image-grid">{product.images.map((image, index) => <article key={`${image}-${index}`}><img src={image} alt="" /><b>{index === 0 ? "当前封面" : `图片 ${index + 1}`}</b><nav><button onClick={() => setCover(index)}>设为封面</button><button onClick={() => moveImage(index, -1)}>上移</button><button onClick={() => moveImage(index, 1)}>下移</button><button onClick={() => setProduct({ ...product, images: product.images.filter((_, itemIndex) => itemIndex !== index) })}>删除</button></nav></article>)}</div></div>}
        {step === "规格与价格" && <div className="gift-repeat-list"><button onClick={() => setProduct({ ...product, specs: [...product.specs, { id: uid("spec"), name: "新规格", price: 0, available: true }] })}>＋ 添加规格</button>{product.specs.map((spec) => <article key={spec.id}><Field label="规格名称" value={spec.name} onChange={(value) => setProduct({ ...product, specs: product.specs.map((item) => item.id === spec.id ? { ...item, name: value } : item) })} /><label><span>价格（人民币）</span><input type="number" value={spec.price} onChange={(event) => setProduct({ ...product, specs: product.specs.map((item) => item.id === spec.id ? { ...item, price: Number(event.target.value) } : item) })} /></label><label className="gift-check"><input type="checkbox" checked={spec.available} onChange={(event) => setProduct({ ...product, specs: product.specs.map((item) => item.id === spec.id ? { ...item, available: event.target.checked } : item) })} /> 可咨询</label><button onClick={() => setProduct({ ...product, specs: product.specs.filter((item) => item.id !== spec.id) })}>删除规格</button></article>)}</div>}
        {step === "商品说明" && <div className="gift-two-column"><Field wide label="适合" value={product.suitableFor} onChange={(value) => setProduct({ ...product, suitableFor: value })} /><Field wide textarea label="简短说明" value={product.simpleDescription} onChange={(value) => setProduct({ ...product, simpleDescription: value })} /><Field wide textarea label="食用 / 使用说明（可选）" value={product.usageNote} onChange={(value) => setProduct({ ...product, usageNote: value })} /><Field wide textarea label="补充说明（可选）" value={product.extraNote} onChange={(value) => setProduct({ ...product, extraNote: value })} /></div>}
        {step === "获取方式" && <div className="gift-two-column"><label className="gift-check wide"><input type="checkbox" checked={product.useDefaultDelivery} onChange={(event) => setProduct({ ...product, useDefaultDelivery: event.target.checked })} /> 使用默认领取与寄送规则：{settings.travelTitle} / {settings.shippingTitle}</label><div className="gift-choice-list wide">{obtainOptions.map((method) => <label key={method}><input type="checkbox" checked={product.obtainMethods.includes(method)} onChange={(event) => setProduct({ ...product, obtainMethods: event.target.checked ? [...product.obtainMethods, method] : product.obtainMethods.filter((item) => item !== method) })} />{method}</label>)}</div><label className="gift-check"><input type="checkbox" checked={product.giftBag} onChange={(event) => setProduct({ ...product, giftBag: event.target.checked })} /> 支持礼袋</label><Field label="礼袋说明" value={product.giftBagNote} onChange={(value) => setProduct({ ...product, giftBagNote: value })} /><div className="gift-choice-list wide"><b>可领取地区</b>{pickupRegionOptions.map((region) => <label key={region}><input type="checkbox" checked={product.pickupRegions.includes(region)} onChange={(event) => setProduct({ ...product, pickupRegions: event.target.checked ? [...product.pickupRegions, region] : product.pickupRegions.filter((item) => item !== region) })} />{region}</label>)}</div></div>}
        {step === "发布" && <div className="gift-publish-check">{[["商品名称", Boolean(product.nameZh)], ["商品分类", Boolean(product.categoryId)], ["商品封面", product.images.length > 0], ["至少一个规格", product.specs.length > 0], ["价格", product.specs.some((spec) => spec.price > 0)], ["获取方式", product.useDefaultDelivery || product.obtainMethods.length > 0], ["商品说明", Boolean(product.simpleDescription || product.shortIntro)]].map(([label, ok]) => <p key={String(label)} className={ok ? "ok" : ""}>{ok ? "✓" : "○"} {label}</p>)}<label><span>状态</span><select value={product.status} onChange={(event) => setProduct({ ...product, status: event.target.value as Status })}><option>草稿</option><option>已上线</option><option>已隐藏</option></select></label><label><span>排序</span><input type="number" value={product.sortOrder} onChange={(event) => setProduct({ ...product, sortOrder: Number(event.target.value) })} /></label></div>}
      </main>
      <aside className="gift-product-preview">{product.images[0] ? <img src={product.images[0]} alt="" /> : <span>暂无图片</span>}<small>{product.recommendationTag || "推荐标签"}</small><h3>{product.nameZh}</h3><p>{product.shortIntro || product.simpleDescription}</p><b>{priceLabel(product.specs)}</b></aside>
    </div>
    <footer><button onClick={onClose}>取消</button><button className="admin-primary" onClick={onSave}>保存商品</button></footer>
  </div></div>;
}

function CategoryModal({ category, setCategory, onSave, onClose }: { category: GiftCategory; setCategory: (category: GiftCategory) => void; onSave: () => void; onClose: () => void }) {
  return <div className="gift-modal" onClick={onClose}><div className="gift-small-modal" onClick={(event) => event.stopPropagation()}><h2>编辑商品分类</h2><Field label="中文名称" value={category.nameZh} onChange={(value) => setCategory({ ...category, nameZh: value })} /><Field label="英文名称" value={category.nameEn} onChange={(value) => setCategory({ ...category, nameEn: value })} /><label><span>排序</span><input type="number" value={category.sortOrder} onChange={(event) => setCategory({ ...category, sortOrder: Number(event.target.value) })} /></label><label><span>状态</span><select value={category.status} onChange={(event) => setCategory({ ...category, status: event.target.value as "显示" | "隐藏" })}><option>显示</option><option>隐藏</option></select></label><footer><button onClick={onClose}>取消</button><button className="admin-primary" onClick={onSave}>保存分类</button></footer></div></div>;
}

function BundleModal({ bundle, setBundle, products, onSave, onClose }: { bundle: GiftBundle; setBundle: (bundle: GiftBundle) => void; products: GiftProduct[]; onSave: () => void; onClose: () => void }) {
  return <div className="gift-modal" onClick={onClose}><div className="gift-small-modal gift-bundle-modal" onClick={(event) => event.stopPropagation()}><h2>编辑精选组合</h2><Field label="组合名称" value={bundle.nameZh} onChange={(value) => setBundle({ ...bundle, nameZh: value })} /><Field label="英文名称" value={bundle.nameEn} onChange={(value) => setBundle({ ...bundle, nameEn: value })} /><Field label="推荐标签" value={bundle.recommendationTag} onChange={(value) => setBundle({ ...bundle, recommendationTag: value })} /><Field textarea label="组合简介" value={bundle.intro} onChange={(value) => setBundle({ ...bundle, intro: value })} /><Field label="封面图片" value={bundle.coverImage} onChange={(value) => setBundle({ ...bundle, coverImage: value })} /><label><span>组合价格</span><input type="number" value={bundle.price} onChange={(event) => setBundle({ ...bundle, price: Number(event.target.value) })} /></label><div className="gift-choice-list"><b>包含商品</b>{products.map((product) => { const item = bundle.items.find((bundleItem) => bundleItem.productId === product.id); return <label key={product.id}><input type="checkbox" checked={Boolean(item)} onChange={(event) => setBundle({ ...bundle, items: event.target.checked ? [...bundle.items, { productId: product.id, quantity: 1 }] : bundle.items.filter((bundleItem) => bundleItem.productId !== product.id) })} />{product.nameZh}{item && <input type="number" value={item.quantity} onChange={(event) => setBundle({ ...bundle, items: bundle.items.map((bundleItem) => bundleItem.productId === product.id ? { ...bundleItem, quantity: Number(event.target.value) } : bundleItem) })} />}</label>; })}</div><label><span>状态</span><select value={bundle.status} onChange={(event) => setBundle({ ...bundle, status: event.target.value as Status })}><option>草稿</option><option>已上线</option><option>已隐藏</option></select></label><footer><button onClick={onClose}>取消</button><button className="admin-primary" onClick={onSave}>保存组合</button></footer></div></div>;
}

function SettingsPanel({ title, description, onSave, children }: { title: string; description: string; onSave: () => void; children: ReactNode }) {
  return <section className="gift-admin-card gift-settings-form"><div className="gift-admin-card-head"><div><h2>{title}</h2><p>{description}</p></div><button onClick={onSave}>保存设置</button></div>{children}</section>;
}

function Field({ label, value, onChange, textarea, wide }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; wide?: boolean }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}
