import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import CommentItem from "./CommentItem";

export default function CommentSection({ 
  videoId, 
  user, 
  comments, 
  commentCount,
  loadingComments,
  postingComment,
  onPostComment,
  onPostReply,
  onEditComment,
  onDeleteComment
}) {
  const [commentText, setCommentText] = useState("");

  const handlePost = async () => {
    if (!commentText.trim()) return;
    
    await onPostComment(commentText);
    setCommentText("");
  };

  return (
    <div className="mt-6 bg-neutral-100 dark:bg-[#181818] rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faComment} />
        {commentCount} Comments
      </h2>

      {/* Add Comment */}
      {user ? (
        <div className="mb-6">
          <div className="flex gap-3">
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 
                  bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows="2"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setCommentText("")}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 
                    hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={!commentText.trim() || postingComment}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg 
                    hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition
                    flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  {postingComment ? "Posting..." : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in
            </Link> to add a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {loadingComments ? (
        <div className="text-center py-8">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              onPostReply={onPostReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}