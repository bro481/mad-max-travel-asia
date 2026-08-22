const DEFAULT_API = "http://127.0.0.1:3000";
const codeEl = document.querySelector("#code");
const apiEl = document.querySelector("#apiBase");
const start = document.querySelector("#start");
const statusEl = document.querySelector("#status");
const bar = document.querySelector("#progress");

const normalizeApiBase = (value) => {
  const text = String(value || "").trim();
  const withProtocol =
    text.startsWith("http://") || text.startsWith("https://")
      ? text
      : `http://${text}`;
  return withProtocol.replace(/\/+$/, "");
};

const readSavedApiBase = () =>
  new Promise((resolve) => {
    try {
      chrome.storage.local.get({ apiBase: DEFAULT_API }, (result) => {
        resolve(normalizeApiBase(result.apiBase || DEFAULT_API));
      });
    } catch {
      resolve(normalizeApiBase(localStorage.getItem("apiBase") || DEFAULT_API));
    }
  });

const saveApiBase = (apiBase) => {
  try {
    chrome.storage.local.set({ apiBase });
  } catch {
    localStorage.setItem("apiBase", apiBase);
  }
};

const status = (text, progress = 0) => {
  statusEl.textContent = text;
  bar.style.width = `${progress}%`;
};
const json = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || `请求失败 (${response.status})`);
  }
};

readSavedApiBase().then((apiBase) => {
  if (apiEl) apiEl.value = apiBase;
});

start.addEventListener("click", async () => {
  const code = codeEl.value.trim();
  if (!/^\d{4,8}$/.test(code)) {
    status("请输入后台生成的数字导入码");
    return;
  }
  const API = normalizeApiBase(apiEl?.value || DEFAULT_API);
  saveApiBase(API);
  start.disabled = true;
  try {
    status(`正在连接后台：${API}`, 2);
    const check = await fetch(`${API}/api/import/${code}`);
    const checked = await json(check);
    if (!check.ok) throw new Error(checked.error || "导入码无效");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.includes("airbnb."))
      throw new Error("请先打开 Airbnb 房源页面");

    status("正在展开并滚动完整相册，请不要关闭页面…", 5);
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const roomId = location.pathname.match(/\/rooms\/(\d+)/)?.[1];
        if (!roomId) return { roomId: null, urls: [], scanned: 0 };
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const showAll = [...document.querySelectorAll("button")].find((button) =>
          /显示所有照片|显示全部照片|show all photos/i.test(
            button.textContent || button.getAttribute("aria-label") || "",
          ),
        );
        if (showAll) {
          showAll.click();
          await wait(1400);
        }

        const found = new Set();
        const visiblePhotos = new Set();
        const collectVisible = () => {
          document.querySelectorAll("img").forEach((image) => {
            const likelyPhoto =
              image.naturalWidth >= 480 ||
              image.getBoundingClientRect().width >= 220;
            [image.currentSrc, image.src, image.getAttribute("data-original-uri")]
              .filter(Boolean)
              .forEach((url) => {
                found.add(url);
                if (
                  likelyPhoto &&
                  url.includes("a0.muscache.com/im/pictures/")
                )
                  visiblePhotos.add(url);
              });
            (image.srcset || "").split(",").forEach((entry) => {
              const url = entry.trim().split(/\s+/)[0];
              if (url) {
                found.add(url);
                if (
                  likelyPhoto &&
                  url.includes("a0.muscache.com/im/pictures/")
                )
                  visiblePhotos.add(url);
              }
            });
          });
          performance
            .getEntriesByType("resource")
            .forEach((entry) => found.add(entry.name));
        };

        let stablePasses = 0;
        let previousCount = 0;
        for (let pass = 0; pass < 140 && stablePasses < 4; pass += 1) {
          collectVisible();
          const scrollables = [
            document.scrollingElement,
            ...document.querySelectorAll("*"),
          ]
            .filter(
              (element) =>
                element &&
                element.clientHeight > 250 &&
                element.scrollHeight > element.clientHeight + 150,
            )
            .sort((a, b) => b.scrollHeight - a.scrollHeight)
            .slice(0, 4);
          let moved = false;
          scrollables.forEach((element) => {
            const before = element.scrollTop;
            element.scrollTop = Math.min(
              element.scrollHeight,
              before + Math.max(600, element.clientHeight * 0.82),
            );
            if (element.scrollTop > before) moved = true;
          });
          await wait(520);
          collectVisible();
          stablePasses =
            found.size === previousCount && !moved ? stablePasses + 1 : 0;
          previousCount = found.size;
        }

        const source = document.documentElement.innerHTML
          .replace(/\\u002F/g, "/")
          .replace(/\\u0026/g, "&")
          .replace(/&amp;/g, "&");
        const matches =
          source.match(
            /https:\/\/a0\.muscache\.com\/im\/pictures\/[^"'\\\s<>()]+/gi,
          ) || [];
        matches.forEach((url) => found.add(url));
        const roomMatched = [...found].filter(
          (url) =>
            url.includes(`/Hosting-${roomId}/`) ||
            url.includes(`/Hosting%20${roomId}/`),
        );
        const clean = [...visiblePhotos, ...roomMatched]
          .filter(Boolean)
          .map((url) => url.replace(/&amp;/g, "&").split("?")[0])
          .filter((url) => url.includes("a0.muscache.com/im/pictures/"));
        return { roomId, urls: [...new Set(clean)], scanned: found.size };
      },
    });
    if (!result.roomId) throw new Error("当前页面不是 Airbnb 房源详情页");
    if (!result.urls.length)
      throw new Error("没有识别到房源图片，请确认房源照片可正常显示");

    const urls = result.urls.slice(0, 50);
    const limited = result.urls.length > urls.length;
    status(
      `共识别 ${result.urls.length} 张${limited ? "，按后台上限导入前 50 张" : ""}，正在下载…`,
      12,
    );
    let uploaded = 0;
    let failed = 0;
    for (let i = 0; i < urls.length; i += 4) {
      const group = urls.slice(i, i + 4);
      const form = new FormData();
      for (let n = 0; n < group.length; n += 1) {
        try {
          const response = await fetch(`${group[n]}?im_w=1440`);
          if (!response.ok) throw new Error("download failed");
          form.append(
            "files",
            await response.blob(),
            `airbnb-${i + n + 1}.jpg`,
          );
        } catch {
          failed += 1;
        }
      }
      if (![...form.keys()].length) continue;
      form.append("complete", String(i + group.length >= urls.length));
      const response = await fetch(`${API}/api/import/${code}`, {
        method: "POST",
        body: form,
      });
      const uploadResult = await json(response);
      if (!response.ok)
        throw new Error(uploadResult.error || "上传失败");
      uploaded = uploadResult.total;
      status(
        `已上传 ${uploaded} 张，下载失败 ${failed} 张`,
        12 + Math.round(((i + group.length) / urls.length) * 84),
      );
    }
    status(
      `导入完成：识别 ${result.urls.length} 张，成功 ${uploaded} 张，失败 ${failed} 张。`,
      100,
    );
  } catch (error) {
    status(
      `导入失败：${error?.message || "请确认当前是 Airbnb 房源照片页面"}`,
    );
  } finally {
    start.disabled = false;
  }
});
