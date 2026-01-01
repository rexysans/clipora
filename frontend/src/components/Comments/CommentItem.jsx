import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faReply, 
  faEdit, 
  faTrash, 
  faChevronDown, 
  faChevronUp 
} from "@fortawesome/free-solid-svg-icons";

export default function CommentItem({ 
  comment, 
  user, 
  onPostReply, 
  onEditComment, 
  onDeleteComment 
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    await onPostReply(comment.id, replyText);
    setReplyText("");
    setReplyingTo(null);
    setExpandedReplies(true);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await onEditComment(comment.id, editText, false);
    setEditingComment(null);
    setEditText("");
  };

  const handleReplyEdit = async (replyId) => {
    if (!editText.trim()) return;
    await onEditComment(replyId, editText, true, comment.id);
    setEditingComment(null);
    setEditText("");
  };

  return (
    <div className="space-y-4">
      {/* Main Comment */}
      <div className="flex gap-3">
        <img
          src={comment.user.avatar}
          alt={comment.user.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.user.name}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDate(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && " (edited)"}
            </span>
          </div>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 
                  bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                rows="2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingComment(null);
                    setEditText("");
                  }}
                  className="px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 
                    hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!editText.trim()}
                  className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded 
                    hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-400 
                    hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faReply} />
                  Reply
                </button>
                {user?.id === comment.userId && (
                  <>
                    <button
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditText(comment.content);
                      }}
                      className="text-xs font-medium text-neutral-600 dark:text-neutral-400 
                        hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteComment(comment.id, false)}
                      className="text-xs font-medium text-neutral-600 dark:text-neutral-400 
                        hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-12 flex gap-3">
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.user.name}...`}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 
                bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              rows="2"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
                className="px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 
                  hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePostReply}
                disabled={!replyText.trim()}
                className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded 
                  hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Replies Toggle Button */}
      {comment.replyCount > 0 && (
        <div className="ml-12">
          <button
            onClick={() => setExpandedReplies(!expandedReplies)}
            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 
              hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-full transition"
          >
            <FontAwesomeIcon icon={expandedReplies ? faChevronUp : faChevronDown} />
            {expandedReplies ? 'Hide' : 'View'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && expandedReplies && (
        <div className="ml-12 space-y-4 pt-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <img
                src={reply.user.avatar}
                alt={reply.user.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {reply.user.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDate(reply.createdAt)}
                    {reply.updatedAt !== reply.createdAt && " (edited)"}
                  </span>
                </div>
                
                {editingComment === reply.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 
                        bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                      rows="2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditText("");
                        }}
                        className="px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 
                          hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplyEdit(reply.id)}
                        disabled={!editText.trim()}
                        className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded 
                          hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
                      {reply.content}
                    </p>
                    {user?.id === reply.userId && (
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => {
                            setEditingComment(reply.id);
                            setEditText(reply.content);
                          }}
                          className="text-xs font-medium text-neutral-600 dark:text-neutral-400 
                            hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteComment(reply.id, true, comment.id)}
                          className="text-xs font-medium text-neutral-600 dark:text-neutral-400 
                            hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}