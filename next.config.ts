import type { NextConfig } from "next";

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
};

export default nextConfig;
