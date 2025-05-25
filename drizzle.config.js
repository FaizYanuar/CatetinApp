
require("dotenv").config();
export default {
  schema: "./utils/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: 'process.env.NEXT_PUBLIC_DATABASE_URL',
  },
};

