import express from "express";

import "dotenv/config";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

import { client } from "./src/db.js";

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true });
});

app.post("/visits/update", async (req, res) => {
  let { user } = req.body;
  try {
    let oldVisit = false;
    if (!user) {
      // Track user in DB if uuid does not exist
      user = uuidv4();
      await client.query(
        "INSERT INTO users (uuid, status) VALUES($1, $2) ON CONFLICT (uuid) DO NOTHING",
        [user, true]
      );
    } else {
      // Set user status to online returning boolean (true) if user was last seen 1 minute ago.
      const visitData = await client.query(
        "UPDATE users SET status = true, last_seen = NOW() WHERE uuid = $1 RETURNING (SELECT (last_seen > NOW() - INTERVAL '1 minute') AS old_visit FROM users WHERE uuid = $2)",
        [user, user]
      );
      oldVisit = visitData.rows[0].old_visit;
    }

    // Update visitors count
    let countData;
    if (!oldVisit) {
      countData = await client.query(
        "UPDATE counters SET count = count + 1 WHERE name = 'visits' RETURNING count"
      );
    } else {
      countData = await client.query(
        "SELECT * FROM counters WHERE name = 'visits'"
      );
    }

    const visits = countData.rows[0].count;

    const usersData = await client.query(
      "SELECT COUNT(*) FROM users WHERE status = true UNION ALL SELECT COUNT(*) FROM users"
    );

    const online = usersData.rows[0].count;
    const unique = usersData.rows[1].count;

    res.json({ user, visits, unique, online });
  } catch (err) {
    res.json({ user: user, visits: -1, unique: -1, online: -1 });
  }
});

// Set user status as online
app.post("/visits/online", async (req, res) => {
  const { user } = req.body;
  try {
    await client.query(
      "UPDATE users SET status = true, last_seen = NOW() WHERE uuid = $1",
      [user]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// Mark inactive users as offline
const POLLING_INTERVAL = 3600000; // 1 hour
setInterval(async () => {
  try {
    await client.query(
      "UPDATE users SET status = false WHERE status = true AND last_seen < NOW() - INTERVAL '1 hour'"
    );
  } catch (err) {
    console.error("Server error updating inactive users");
  }
}, POLLING_INTERVAL);

app.listen(5050, () => console.log("🚀 Server is listening on port 5050..."));
