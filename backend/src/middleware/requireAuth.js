import jwt from "jsonwebtoken";
import pool from "../db.js";

export default async function requireAuth(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.sendStatus(401);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query(
      "SELECT id, email, name, avatar_url FROM users WHERE id = $1",
      [payload.sub]
    );

    if (!user.rows.length) return res.sendStatus(401);

    req.user = user.rows[0];
    next();
  } catch {
    res.sendStatus(401);
  }
}
