import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "ghndlmbjjkdonkbbbadnpapgdgncfchf",
        "dcpcjabgpocjmbiaadhjdnjkiofmmkcj",
        "jnndkdhenmlaelfpmecpllolcjoalmc",
      ],
      bodySizeLimit: "20mb",
    },
  },
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^cloudflare:workers$/,
        path.resolve(process.cwd(), "worker/local-cloudflare-workers.ts"),
      ),
    );
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "cloudflare:workers": path.resolve(
        process.cwd(),
        "worker/local-cloudflare-workers.ts",
      ),
    };
    return config;
  },
};

export default nextConfig;
