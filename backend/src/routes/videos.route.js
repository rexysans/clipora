import { Router } from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

import { upload } from "../middleware/upload.js";
import { STORAGE } from "../config/storage.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// Get all videos with uploader info
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.title, 
        v.description, 
        v.status, 
        v.created_at, 
        v.views, 
        v.likes,
        v.dislikes,
        v.thumbnail_path,
        u.id as uploader_id,
        u.name as uploader_name,
        u.avatar_url as uploader_avatar
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      ORDER BY v.created_at DESC
    `);
    
    const videos = result.rows.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      status: v.status,
      created_at: v.created_at,
      views: v.views || 0,
      likes: v.likes || 0,
      dislikes: v.dislikes || 0,
      thumbnailUrl: v.thumbnail_path
        ? `http://localhost:8080/thumbs/${v.thumbnail_path}`
        : null,
      uploader: v.uploader_id ? {
        id: v.uploader_id,
        name: v.uploader_name,
        avatar: v.uploader_avatar,
      } : null,
    }));
    
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get single video by ID with uploader info and user's reaction
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId; // Optional: pass userId to get their reaction
    
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.title, 
        v.description, 
        v.status, 
        v.created_at, 
        v.hls_key, 
        v.views, 
        v.likes,
        v.dislikes,
        v.comment_count,
        v.thumbnail_path,
        u.id as uploader_id,
        u.name as uploader_name,
        u.avatar_url as uploader_avatar
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    const video = result.rows[0];

    // Get user's reaction if userId provided
    let userReaction = null;
    if (userId) {
      const reactionResult = await pool.query(
        "SELECT reaction_type FROM video_reactions WHERE user_id = $1 AND video_id = $2",
        [userId, id]
      );
      if (reactionResult.rows.length > 0) {
        userReaction = reactionResult.rows[0].reaction_type;
      }
    }

    const playbackUrl =
      video.hls_key && video.status === "ready"
        ? `${STORAGE.MEDIA_BASE_URL}/${video.hls_key}`
        : null;

    const thumbnailUrl = video.thumbnail_path
      ? `http://localhost:8080/thumbs/${video.thumbnail_path}`
      : null;

    res.json({
      id: video.id,
      title: video.title,
      description: video.description,
      status: video.status,
      created_at: video.created_at,
      playbackUrl,
      views: video.views || 0,
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      commentCount: video.comment_count || 0,
      thumbnailUrl,
      userReaction,
      uploader: video.uploader_id ? {
        id: video.uploader_id,
        name: video.uploader_name,
        avatar: video.uploader_avatar,
      } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

// Like/Dislike video (protected by auth)
router.post("/:id/reaction", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const videoId = req.params.id;
  const { reaction } = req.body; // 'like', 'dislike', or 'remove'

  try {
    // Validate reaction type
    if (!['like', 'dislike', 'remove'].includes(reaction)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    // Check if video exists
    const videoExists = await pool.query(
      "SELECT likes, dislikes FROM videos WHERE id = $1",
      [videoId]
    );

    if (videoExists.rowCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Get current reaction
    const currentReaction = await pool.query(
      "SELECT reaction_type FROM video_reactions WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );

    const hadReaction = currentReaction.rowCount > 0;
    const oldReaction = hadReaction ? currentReaction.rows[0].reaction_type : null;

    // Begin transaction
    await pool.query("BEGIN");

    if (reaction === 'remove') {
      // Remove reaction
      if (hadReaction) {
        await pool.query(
          "DELETE FROM video_reactions WHERE user_id = $1 AND video_id = $2",
          [userId, videoId]
        );

        // Update counts
        if (oldReaction === 'like') {
          await pool.query(
            "UPDATE videos SET likes = GREATEST(likes - 1, 0) WHERE id = $1",
            [videoId]
          );
        } else if (oldReaction === 'dislike') {
          await pool.query(
            "UPDATE videos SET dislikes = GREATEST(dislikes - 1, 0) WHERE id = $1",
            [videoId]
          );
        }
      }
    } else {
      // Add or update reaction
      if (hadReaction) {
        // Update existing reaction
        if (oldReaction !== reaction) {
          await pool.query(
            "UPDATE video_reactions SET reaction_type = $1 WHERE user_id = $2 AND video_id = $3",
            [reaction, userId, videoId]
          );

          // Update counts (remove old, add new)
          if (oldReaction === 'like') {
            await pool.query(
              "UPDATE videos SET likes = GREATEST(likes - 1, 0), dislikes = dislikes + 1 WHERE id = $1",
              [videoId]
            );
          } else {
            await pool.query(
              "UPDATE videos SET dislikes = GREATEST(dislikes - 1, 0), likes = likes + 1 WHERE id = $1",
              [videoId]
            );
          }
        }
      } else {
        // Insert new reaction
        await pool.query(
          "INSERT INTO video_reactions (user_id, video_id, reaction_type) VALUES ($1, $2, $3)",
          [userId, videoId, reaction]
        );

        // Update counts
        if (reaction === 'like') {
          await pool.query(
            "UPDATE videos SET likes = likes + 1 WHERE id = $1",
            [videoId]
          );
        } else {
          await pool.query(
            "UPDATE videos SET dislikes = dislikes + 1 WHERE id = $1",
            [videoId]
          );
        }
      }
    }

    await pool.query("COMMIT");

    // Get updated counts
    const updated = await pool.query(
      "SELECT likes, dislikes FROM videos WHERE id = $1",
      [videoId]
    );

    res.json({
      likes: updated.rows[0].likes,
      dislikes: updated.rows[0].dislikes,
      userReaction: reaction === 'remove' ? null : reaction,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error updating reaction:", error);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

// Track video view (protected by auth)
router.post("/:id/view", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const videoId = req.params.id;

  try {
    const exists = await pool.query(
      "SELECT 1 FROM video_views WHERE user_id = $1 AND video_id = $2",
      [userId, videoId]
    );

    if (exists.rowCount > 0) {
      return res.sendStatus(204);
    }

    const videoExists = await pool.query(
      "SELECT 1 FROM videos WHERE id = $1",
      [videoId]
    );

    if (videoExists.rowCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    await pool.query("BEGIN");

    await pool.query(
      "INSERT INTO video_views (user_id, video_id) VALUES ($1, $2)",
      [userId, videoId]
    );

    await pool.query(
      "UPDATE videos SET views = views + 1 WHERE id = $1",
      [videoId]
    );

    await pool.query("COMMIT");

    res.sendStatus(201);
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error tracking view:", error);
    res.status(500).json({ error: "Failed to track view" });
  }
});

// Upload video - requires authentication
router.post("/upload", requireAuth, upload.single("video"), async (req, res) => {
  try {
    const data = req.body;
    const title = data.title;
    const uploaderId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "Video file is required" });
    }

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    const filePath = req.file.path;
    const id = uuidv4();
    const description = data.description || null;
    const status = "uploaded";
    const input_path = filePath;
    
    const query = {
      text: "INSERT INTO videos (id,title,description,status,input_path,uploader_id) VALUES ($1,$2,$3,$4,$5,$6)",
      values: [id, title, description, status, input_path, uploaderId],
    };

    await pool.query(query);
    res.status(201).json({
      id,
      status: "uploaded",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Upload failed",
    });
  }
});

// Get comments for a video
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    // Get all comments with user info
    const result = await pool.query(`
      SELECT 
        c.id,
        c.video_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name as user_name,
        u.avatar_url as user_avatar,
        COUNT(replies.id) as reply_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comments replies ON replies.parent_comment_id = c.id
      WHERE c.video_id = $1
      GROUP BY c.id, u.name, u.avatar_url
      ORDER BY c.created_at DESC
    `, [id]);

    // Organize comments into tree structure
    const comments = result.rows.filter(c => !c.parent_comment_id).map(comment => ({
      id: comment.id,
      videoId: comment.video_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        name: comment.user_name,
        avatar: comment.user_avatar,
      },
      replyCount: parseInt(comment.reply_count),
      replies: result.rows
        .filter(r => r.parent_comment_id === comment.id)
        .map(reply => ({
          id: reply.id,
          videoId: reply.video_id,
          userId: reply.user_id,
          parentCommentId: reply.parent_comment_id,
          content: reply.content,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          user: {
            name: reply.user_name,
            avatar: reply.user_avatar,
          },
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    }));

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Post a comment
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;
    const { content, parentCommentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: "Comment too long (max 5000 characters)" });
    }

    // Check if video exists
    const videoExists = await pool.query(
      "SELECT 1 FROM videos WHERE id = $1",
      [videoId]
    );

    if (videoExists.rowCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    // If it's a reply, check if parent comment exists
    if (parentCommentId) {
      const parentExists = await pool.query(
        "SELECT 1 FROM comments WHERE id = $1 AND video_id = $2",
        [parentCommentId, videoId]
      );

      if (parentExists.rowCount === 0) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    // Insert comment
    const result = await pool.query(`
      INSERT INTO comments (video_id, user_id, parent_comment_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, video_id, user_id, parent_comment_id, content, created_at, updated_at
    `, [videoId, userId, parentCommentId || null, content.trim()]);

    // Get user info
    const userInfo = await pool.query(
      "SELECT name, avatar_url FROM users WHERE id = $1",
      [userId]
    );

    const comment = result.rows[0];
    res.status(201).json({
      id: comment.id,
      videoId: comment.video_id,
      userId: comment.user_id,
      parentCommentId: comment.parent_comment_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        name: userInfo.rows[0].name,
        avatar: userInfo.rows[0].avatar_url,
      },
      replyCount: 0,
      replies: [],
    });
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// Delete a comment
router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const { id: videoId, commentId } = req.params;
    const userId = req.user.id;

    // Check if comment exists and belongs to user
    const comment = await pool.query(
      "SELECT user_id FROM comments WHERE id = $1 AND video_id = $2",
      [commentId, videoId]
    );

    if (comment.rowCount === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    // Delete comment (cascade will delete replies)
    await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);

    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Update a comment
router.put("/:id/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const { id: videoId, commentId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: "Comment too long (max 5000 characters)" });
    }

    // Check if comment exists and belongs to user
    const comment = await pool.query(
      "SELECT user_id FROM comments WHERE id = $1 AND video_id = $2",
      [commentId, videoId]
    );

    if (comment.rowCount === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this comment" });
    }

    // Update comment
    const result = await pool.query(`
      UPDATE comments 
      SET content = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, content, updated_at
    `, [content.trim(), commentId]);

    res.json({
      id: result.rows[0].id,
      content: result.rows[0].content,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

export default router;