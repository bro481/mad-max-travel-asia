const unsupported = () => {
  throw new Error(
    "Cloudflare bindings are unavailable in LOCAL_BROWSER_PREVIEW mode.",
  );
};

const statement = {
  bind: () => statement,
  first: unsupported,
  all: unsupported,
  run: unsupported,
};

export const env = {
  DB: {
    prepare: () => statement,
  },
  IMAGES: {
    get: unsupported,
    put: unsupported,
  },
};
