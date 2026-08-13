import { defineConfig } from "drizzle-kit";

import { env } from "./src/common/env";

export default defineConfig({
  dialect: "postgresql",
  casing: "snake_case",
  schema: "./src/db/schemas",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
