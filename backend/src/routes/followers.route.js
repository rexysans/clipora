import { Router } from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// Follow a user
router.post("/:userId/follow", requireAuth, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    // Check if user exists
    const userExists = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [followingId]
    );

    if (userExists.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const alreadyFollowing = await pool.query(
      "SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );

    if (alreadyFollowing.rowCount > 0) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Begin transaction
    await pool.query("BEGIN");

    // Insert follow relationship
    await pool.query(
      "INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)",
      [followerId, followingId]
    );

    // Update counts
    await pool.query(
      "UPDATE users SET follower_count = follower_count + 1 WHERE id = $1",
      [followingId]
    );

    await pool.query(
      "UPDATE users SET following_count = following_count + 1 WHERE id = $1",
      [followerId]
    );

    await pool.query("COMMIT");

    // Get updated counts
    const result = await pool.query(
      "SELECT follower_count FROM users WHERE id = $1",
      [followingId]
    );

    res.json({
      message: "Successfully followed user",
      followerCount: result.rows[0].follower_count,
      isFollowing: true,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow a user
router.delete("/:userId/follow", requireAuth, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    // Check if following
    const following = await pool.query(
      "SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );

    if (following.rowCount === 0) {
      return res.status(400).json({ error: "Not following this user" });
    }

    // Begin transaction
    await pool.query("BEGIN");

    // Delete follow relationship
    await pool.query(
      "DELETE FROM followers WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );

    // Update counts
    await pool.query(
      "UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1",
      [followingId]
    );

    await pool.query(
      "UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = $1",
      [followerId]
    );

    await pool.query("COMMIT");

    // Get updated counts
    const result = await pool.query(
      "SELECT follower_count FROM users WHERE id = $1",
      [followingId]
    );

    res.json({
      message: "Successfully unfollowed user",
      followerCount: result.rows[0].follower_count,
      isFollowing: false,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Check if following a user
router.get("/:userId/follow-status", requireAuth, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    const result = await pool.query(
      "SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );

    res.json({ isFollowing: result.rowCount > 0 });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ error: "Failed to check follow status" });
  }
});

// Get user's followers
router.get("/:userId/followers", async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
         u.follower_name,
        u.avatar_url,
        f.created_at as followed_at
      FROM followers f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// Get user's following
router.get("/:userId/following", async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.avatar_url,
        u.follower_name,
        f.created_at as followed_at
      FROM followers f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});

// Update follower name (what to call followers)
router.put("/follower-name", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { followerName } = req.body;

    if (!followerName || followerName.trim().length === 0) {
      return res.status(400).json({ error: "Follower name is required" });
    }

    if (followerName.length > 50) {
      return res.status(400).json({ error: "Follower name too long (max 50 characters)" });
    }

    await pool.query(
      "UPDATE users SET follower_name = $1 WHERE id = $2",
      [followerName.trim(), userId]
    );

    res.json({
      message: "Follower name updated successfully",
      followerName: followerName.trim(),
    });
  } catch (error) {
    console.error("Error updating follower name:", error);
    res.status(500).json({ error: "Failed to update follower name" });
  }
});

export default router;
