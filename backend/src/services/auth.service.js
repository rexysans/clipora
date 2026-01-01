import pool from "../db.js";

export async function findOrCreateGoogleUser(profile) {
  const googleId = profile.id;
  const email = profile.emails[0].value;
  const name = profile.displayName;
  const avatar = profile.photos[0].value;

  const existing = await pool.query(
    "SELECT * FROM users WHERE google_id = $1",
    [googleId]
  );

  if (existing.rows.length) {
    await pool.query(
      "UPDATE users SET last_login = now() WHERE id = $1",
      [existing.rows[0].id]
    );
    return existing.rows[0];
  }

  const created = await pool.query(
    `INSERT INTO users (google_id, email, name, avatar_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [googleId, email, name, avatar]
  );

  return created.rows[0];
}
