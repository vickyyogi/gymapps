import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Container image ships .next/standalone + .next/static (see apps/web/Dockerfile).
  output: "standalone",
  transpilePackages: ["@gymapps/db", "@gymapps/domain", "@gymapps/shared"],
  allowedDevOrigins: ["192.168.1.14"],
  // Dynamic import in reports.ts; traced output drops browsers.json, so the
  // Docker image copies the real package instead.
  serverExternalPackages: ["@prisma/client", "@node-rs/argon2", "playwright-core"]
};

export default withNextIntl(nextConfig);
