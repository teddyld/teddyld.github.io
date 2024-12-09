import "dotenv/config";
import pg from "pg";

export const client = new pg.Client(process.env.DATABASE_URL);

client.connect().then(() => {
  console.log("🚀 Connected to PostgreSQL database");
});
