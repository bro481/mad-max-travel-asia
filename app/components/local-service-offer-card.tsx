"use client";

export type LocalServiceOfferCardData = {
  title: [string, string];
  description: [string, string];
  tags: Array<[string, string]>;
  image: string;
};

export function LocalServiceOfferCard({
  data,
  lang = "zh",
  onOpen,
}: {
  data: LocalServiceOfferCardData;
  lang?: "zh" | "en";
  onOpen?: () => void;
}) {
  const l = lang === "zh" ? 0 : 1;
  return (
    <button className="offer-card" type="button" onClick={onOpen}>
      {data.image ? <img src={data.image} alt={data.title[l]} /> : <span className="offer-card-placeholder">添加服务封面图</span>}
      <div>
        <h4>{data.title[l]}</h4>
        <p>{data.description[l]}</p>
        <div>
          {data.tags.map((tag) => (
            <span key={tag[0]}>{tag[l]}</span>
          ))}
        </div>
      </div>
    </button>
  );
}
