import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  },
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
      "packages/shared/src/openapi.d.ts",
      "packages/db/src/generated/**",
      "infra/**",
      "apps/web/*.cjs",
      "apps/web/shots/**",
      ".opencode/**"
    ]
  }
];

export default config;
