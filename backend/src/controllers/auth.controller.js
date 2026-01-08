import { signJwt } from "../utils/jwt.js";
import pool from "../db.js";

export const googleCallback = (req, res) => {
  const token = signJwt(req.user.id);

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only secure in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Use 'lax' in development
    maxAge: 15 * 60 * 1000,
  });

  res.redirect(process.env.FRONTEND_URL);
};

export const me = (req, res) => {
  res.json(req.user);
};

export const logout = (req, res) => {
  res.clearCookie("access_token");
  res.sendStatus(204);
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: "Invalid username length" });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Invalid username format" });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check username" });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: "Invalid username length" });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Invalid username format" });
    }

    // Check if username is already taken
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [username, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Update username
    await pool.query(
      "UPDATE users SET username = $1 WHERE id = $2",
      [username, userId]
    );

    res.json({ success: true, username });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: "Username already taken" });
    }
    res.status(500).json({ error: "Failed to update username" });
  }
};