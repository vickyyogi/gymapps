import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@gymapps/db", "@gymapps/domain", "@gymapps/shared"],
  allowedDevOrigins: ["192.168.1.14"],
  serverExternalPackages: ["@prisma/client", "@node-rs/argon2"]
};

export default withNextIntl(nextConfig);
