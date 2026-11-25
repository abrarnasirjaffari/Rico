/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@a2ui/react", "@a2ui/web_core", "@a2ui/markdown-it"],
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "postgres",
      "playwright",
      "@a2ui/agent",
    ],
  },
};

export default nextConfig;
