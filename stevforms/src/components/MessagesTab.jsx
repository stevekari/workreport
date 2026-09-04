import { useState, useEffect } from "react";
import { api } from "../api/api";
import { badgeClass } from "../api/data";

export default function MessagesTab({ t }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL"); // 'ALL' | 'MEETING' | 'ANNOUNCEMENT' | 'SHORTAGE' | 'ISSUE' | 'NOTE'
  const [commentText, setCommentText] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});

  // New Announcement / Meeting Modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType] = useState("MEETING"); // 'MEETING' | 'ANNOUNCEMENT'
  const [postTitle, setPostTitle] = useState("");
  const [postMeetingDate, setPostMeetingDate] = useState("");
  const [postDepartment, setPostDepartment] = useState("ALL");
  const [postContent, setPostContent] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    let ignore = false;
    api
      .listMessages()
      .then((data) => {
        if (!ignore) {
          setMessages(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleToggleLike(id) {
    try {
      const res = await api.toggleLikeMessage(id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, likesCount: res.likesCount, likedByMe: res.likedByMe }
            : m,
        ),
      );
    } catch (err) {
      alert(err.message || "Could not like notice");
    }
  }

  async function handleAddComment(e, id) {
    e.preventDefault();
    const text = commentText[id]?.trim();
    if (!text) return;

    try {
      const newComment = await api.addMessageComment(id, text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, comments: [...(m.comments || []), newComment] }
            : m,
        ),
      );
      setCommentText((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      alert(err.message || "Could not add comment");
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    setPostError("");

    if (!postTitle.trim() && !postContent.trim()) {
      setPostError("Please enter a title or message content.");
      return;
    }

    setSubmittingPost(true);
    try {
      const payload = {
        title: postTitle.trim(),
        type: postType,
        meetingDate: postType === "MEETING" ? postMeetingDate.trim() : null,
        department: postDepartment,
        content: postContent.trim() || (postType === "MEETING" ? `Meeting on ${postMeetingDate}` : postTitle.trim()),
      };

      const created = await api.sendMessage(payload);
      setMessages((prev) => [created, ...prev]);
      setShowPostModal(false);
      setPostTitle("");
      setPostMeetingDate("");
      setPostContent("");
      setPostDepartment("ALL");
    } catch (err) {
      setPostError(err.message || "Could not publish notice");
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleStatusChange(id, newStatus, reply = null) {
    try {
      const payload = { status: newStatus };
      if (reply !== null) {
        payload.adminReply = reply;
      }
      const updated = await api.updateMessageStatus(id, payload);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      alert(err.message || "Could not update status");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err.message || "Could not delete notice");
    }
  }

  const filteredMessages = messages.filter((m) => {
    if (filterType === "ALL") return true;
    if (filterType === "MEETING") return m.type === "MEETING";
    if (filterType === "ANNOUNCEMENT") return m.type === "ANNOUNCEMENT";
    if (filterType === "SHORTAGE") return m.type === "SHORTAGE";
    if (filterType === "PENDING") return m.status === "UNREAD" || m.status === "ACTIVE";
    if (filterType === "RESOLVED") return m.status === "RESOLVED";
    return m.type === filterType;
  });

  const meetingCount = messages.filter((m) => m.type === "MEETING").length;
  const shortageCount = messages.filter((m) => m.type === "SHORTAGE" && m.status !== "RESOLVED").length;

  return (
    <div className="messages-tab-wrap">
      {/* Top Header with Post Button */}
      <div className="messages-header-row">
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            📢 {t ? t("groupNoticeboard") : "Group Noticeboard & Meetings"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Broadcast meetings, company announcements, and resolve worker alerts.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowPostModal(true)}
          style={{ whiteSpace: "nowrap" }}
        >
          ➕ {t ? t("scheduleMeeting") : "Schedule Meeting / Announce"}
        </button>
      </div>

      {/* Stats summary bar */}
      <div className="messages-summary-bar" style={{ marginTop: 16 }}>
        <div className="msg-summary-card">
          <div className="msg-summary-num">{messages.length}</div>
          <div className="msg-summary-label">{t ? t("messages") : "Total Notices"}</div>
        </div>
        <div className="msg-summary-card" style={{ borderColor: meetingCount > 0 ? "var(--accent)" : "var(--border)" }}>
          <div className="msg-summary-num" style={{ color: "var(--accent)" }}>
            {meetingCount}
          </div>
          <div className="msg-summary-label">📅 Meetings</div>
        </div>
        <div className="msg-summary-card" style={{ borderColor: shortageCount > 0 ? "var(--danger)" : "var(--border)" }}>
          <div className="msg-summary-num" style={{ color: shortageCount > 0 ? "var(--danger)" : "var(--text)" }}>
            {shortageCount}
          </div>
          <div className="msg-summary-label">🚨 Shortages</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="messages-filter-row">
        <button
          type="button"
          className={`btn btn-sm ${filterType === "ALL" ? "btn-active" : ""}`}
          onClick={() => setFilterType("ALL")}
        >
          All ({messages.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterType === "MEETING" ? "btn-active" : ""}`}
          onClick={() => setFilterType("MEETING")}
        >
          📅 {t ? t("meetingTag") : "Meetings"} ({meetingCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterType === "ANNOUNCEMENT" ? "btn-active" : ""}`}
          onClick={() => setFilterType("ANNOUNCEMENT")}
        >
          📢 {t ? t("announcementTag") : "Announcements"}
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterType === "SHORTAGE" ? "btn-active" : ""}`}
          onClick={() => setFilterType("SHORTAGE")}
        >
          🚨 {t ? t("shortageTag") : "Shortages"} ({shortageCount})
        </button>
      </div>

      {/* Notice Feed List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
          Loading notices…
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="empty-messages-box">
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{t ? t("noNoticesYet") : "No announcements or meeting notices yet"}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Click &quot;Schedule Meeting / Announce&quot; to notify all group members.
          </div>
        </div>
      ) : (
        <div className="messages-feed">
          {filteredMessages.map((m) => {
            const isMeeting = m.type === "MEETING";
            const isShortage = m.type === "SHORTAGE";
            const isAnnouncement = m.type === "ANNOUNCEMENT";
            const comments = m.comments || [];

            return (
              <div
                key={m.id}
                className={`msg-card ${isMeeting ? "msg-card-meeting" : isShortage ? "msg-card-shortage" : ""}`}
              >
                {/* Meeting Highlight Header */}
                {isMeeting && (
                  <div className="meeting-banner-row">
                    <div className="meeting-date-pill">
                      📅 {t ? t("nextMeeting") : "Next Meeting"}: <strong>{m.meetingDate || "Date to be announced"}</strong>
                    </div>
                    <span className="badge badge-accent">👥 {m.department === "ALL" ? (t ? t("allMembers") : "All Group") : m.department}</span>
                  </div>
                )}

                {/* Sender Row */}
                <div className="msg-header-row">
                  <div className="msg-sender-info">
                    {m.senderProfilePicture ? (
                      <img
                        src={m.senderProfilePicture}
                        alt=""
                        className="avatar"
                        style={{ width: 34, height: 34 }}
                      />
                    ) : (
                      <span className="avatar" style={{ width: 34, height: 34, fontSize: 16 }}>
                        {isMeeting ? "📅" : isShortage ? "🚨" : isAnnouncement ? "📢" : "👤"}
                      </span>
                    )}
                    <div>
                      <div className="msg-sender-name">
                        {m.senderName} {m.senderDisplayId ? <span className="msg-sender-id">({m.senderDisplayId})</span> : null}
                      </div>
                      <div className="msg-meta-row">
                        <span className={`badge ${badgeClass(m.department)} msg-dept-tag`}>
                          {m.department}
                        </span>
                        <span className="msg-timestamp">{m.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="msg-type-badge-wrap">
                    {isMeeting && <span className="badge badge-accent">📅 {t ? t("meetingTag") : "Meeting"}</span>}
                    {isAnnouncement && <span className="badge badge-primary">📢 {t ? t("announcementTag") : "Announcement"}</span>}
                    {isShortage && <span className="badge badge-danger">🚨 {t ? t("shortageTag") : "Shortage"}</span>}
                    {m.type === "ISSUE" && <span className="badge badge-warning">⚠️ {t ? t("issueTag") : "Issue"}</span>}
                    {m.type === "NOTE" && <span className="badge badge-default">📝 {t ? t("generalTag") : "Note"}</span>}
                  </div>
                </div>

                {/* Title if present */}
                {m.title && (
                  <h3 className="msg-title-text">{m.title}</h3>
                )}

                {/* Shortage item alert */}
                {isShortage && m.itemNeeded && (
                  <div className="msg-item-alert">
                    <strong>{t ? t("itemNeeded") : "Item Needed"}:</strong> {m.itemNeeded}
                  </div>
                )}

                {/* Content */}
                <div className="msg-body-content">{m.content}</div>

                {/* Admin Reply box if present */}
                {m.adminReply && (
                  <div className="msg-admin-reply-box">
                    <div className="admin-reply-title">🏢 {t ? t("adminReplyLabel") : "Admin Reply"}:</div>
                    <div className="admin-reply-text">{m.adminReply}</div>
                  </div>
                )}

                {/* Action Toolbar: Like, Comment, Reply, Status */}
                <div className="msg-action-toolbar">
                  <div className="msg-social-actions">
                    {/* Like Button */}
                    <button
                      type="button"
                      className={`btn-like ${m.likedByMe ? "liked" : ""}`}
                      onClick={() => handleToggleLike(m.id)}
                      title={m.likedByMe ? (t ? t("liked") : "Liked") : (t ? t("like") : "Like")}
                    >
                      <span className="like-heart">{m.likedByMe ? "❤️" : "🤍"}</span>
                      <span className="like-label">{m.likedByMe ? (t ? t("liked") : "Liked") : (t ? t("like") : "Like")}</span>
                      {m.likesCount > 0 && <span className="like-counter">{m.likesCount}</span>}
                    </button>

                    {/* Comment toggle button */}
                    <button
                      type="button"
                      className="btn-comment"
                      onClick={() =>
                        setShowCommentBox((prev) => ({
                          ...prev,
                          [m.id]: !prev[m.id],
                        }))
                      }
                    >
                      <span>💬</span>
                      <span>{t ? t("comments") : "Comments"}</span>
                      {comments.length > 0 && <span className="comment-counter">({comments.length})</span>}
                    </button>
                  </div>

                  <div className="msg-admin-controls">
                    {/* Admin status resolve buttons */}
                    {isShortage && m.status !== "RESOLVED" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ color: "#3fb950", borderColor: "#3fb950" }}
                        onClick={() => handleStatusChange(m.id, "RESOLVED")}
                      >
                        {t ? t("markResolved") : "✅ Mark Resolved"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-icon-delete"
                      onClick={() => handleDelete(m.id)}
                      title="Delete Notice"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Comment Section (Open by default if has comments, or toggled) */}
                {(showCommentBox[m.id] || comments.length > 0) && (
                  <div className="msg-comment-section">
                    {/* Comments List */}
                    {comments.length > 0 && (
                      <div className="comment-list">
                        {comments.map((c) => (
                          <div key={c.id} className="comment-item">
                            <span className="comment-author-avatar">
                              {c.authorProfilePicture ? (
                                <img src={c.authorProfilePicture} alt="" className="avatar" style={{ width: 22, height: 22 }} />
                              ) : (
                                "👤"
                              )}
                            </span>
                            <div className="comment-bubble">
                              <div className="comment-author-name">
                                {c.authorName} {c.authorDisplayId && <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>({c.authorDisplayId})</small>}
                                <span className="comment-time">{c.createdAt}</span>
                              </div>
                              <div className="comment-text">{c.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <form onSubmit={(e) => handleAddComment(e, m.id)} className="comment-input-row">
                      <input
                        type="text"
                        placeholder={t ? t("writeReply") : "Write a reply or confirm attendance…"}
                        value={commentText[m.id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [m.id]: e.target.value,
                          }))
                        }
                        className="comment-input-field"
                      />
                      <button type="submit" className="btn btn-sm btn-primary" style={{ padding: "6px 14px" }}>
                        {t ? t("postComment") : "Post"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting / Post Announcement Modal */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>📢 {t ? t("newAnnouncement") : "Schedule Meeting / Announcement"}</h3>
              <button type="button" className="icon-btn" onClick={() => setShowPostModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type Switcher */}
              <div className="btn-row" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className={`btn ${postType === "MEETING" ? "btn-active" : ""}`}
                  onClick={() => setPostType("MEETING")}
                >
                  📅 {t ? t("meetingTag") : "Meeting Notice"}
                </button>
                <button
                  type="button"
                  className={`btn ${postType === "ANNOUNCEMENT" ? "btn-active" : ""}`}
                  onClick={() => setPostType("ANNOUNCEMENT")}
                >
                  📢 {t ? t("announcementTag") : "General Announcement"}
                </button>
              </div>

              {/* Subject / Title */}
              <div className="field">
                <label>📌 {t ? t("announcementTitle") : "Subject / Title"}</label>
                <input
                  type="text"
                  placeholder={t ? t("announcementPlaceholder") : "e.g. Next Team Meeting or Maintenance Notice…"}
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Meeting Date & Time (for Meeting type) */}
              {postType === "MEETING" && (
                <div className="field">
                  <label>📅 {t ? t("meetingDate") : "Meeting Date & Time *"}</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-08-28 10:00 AM (Main Hall)"
                    value={postMeetingDate}
                    onChange={(e) => setPostMeetingDate(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Target Audience / Department */}
              <div className="field">
                <label>👥 {t ? t("targetAudience") : "Target Audience"}</label>
                <select
                  value={postDepartment}
                  onChange={(e) => setPostDepartment(e.target.value)}
                >
                  <option value="ALL">👥 {t ? t("allMembers") : "All Group Members (Broadcast)"}</option>
                  <option value="Color">🎨 Color Department</option>
                  <option value="Drying">🔥 Drying Department</option>
                  <option value="Roll">📜 Roll Department</option>
                </select>
              </div>

              {/* Description / Content */}
              <div className="field">
                <label>📝 {t ? t("messageNote") : "Details / Agenda"}</label>
                <textarea
                  rows={4}
                  placeholder="Provide meeting agenda, location, or details for the team…"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--input-bg)",
                    color: "var(--text)",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {postError && <div className="error-text">⚠️ {postError}</div>}

              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setShowPostModal(false)}>
                  {t ? t("cancel") : "Cancel"}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPost}>
                  {submittingPost ? "Posting…" : "🚀 Publish to Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
