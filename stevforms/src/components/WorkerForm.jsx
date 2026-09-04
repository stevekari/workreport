import { useEffect, useState } from "react";
import { api } from "../api/api";
import { badgeClass, formatDate, today } from "../api/data";

export default function WorkerForm({
  user,
  t,
  selectedProduct,
  onProductAdded,
  onLogout,
}) {
  const assignedDept = user?.department || "Color";
  const [activeTab, setActiveTab] = useState("form"); // 'form' | 'notices'
  const [product, setProduct] = useState(selectedProduct || "");
  const [prevSelectedProduct, setPrevSelectedProduct] = useState(selectedProduct);
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(today());
  const [products, setProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Group Notices & Messaging state
  const [showMsgComposer, setShowMsgComposer] = useState(false);
  const [msgType, setMsgType] = useState("SHORTAGE"); // 'SHORTAGE' | 'ISSUE' | 'NOTE'
  const [msgItemNeeded, setMsgItemNeeded] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");
  const [messages, setMessages] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});

  if (selectedProduct !== prevSelectedProduct) {
    setPrevSelectedProduct(selectedProduct);
    setProduct(selectedProduct || "");
  }

  useEffect(() => {
    let ignore = false;
    api
      .listProducts()
      .then((data) => {
        if (!ignore) {
          setProducts(data || []);
          if (onProductAdded) onProductAdded(data);
        }
      })
      .catch(() => {});

    api
      .listEntries()
      .then((data) => {
        if (!ignore) setMySubmissions(data || []);
      })
      .catch(() => {});

    loadNotices();

    return () => {
      ignore = true;
    };
  }, [onProductAdded]);

  async function loadNotices() {
    try {
      const data = await api.listMessages();
      setMessages(data || []);
    } catch {
      /* ignore */
    }
  }

  async function reloadProducts() {
    try {
      const data = await api.listProducts();
      setProducts(data || []);
      if (onProductAdded) onProductAdded(data);
    } catch {
      /* ignore */
    }
  }

  async function reloadSubmissions() {
    try {
      const data = await api.listEntries();
      setMySubmissions(data || []);
    } catch {
      /* ignore */
    }
  }

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

  async function handleSendMessage(e) {
    e.preventDefault();
    setMsgError("");
    setMsgSuccess("");

    if (!msgContent.trim() && !msgItemNeeded.trim()) {
      setMsgError("Please enter the material needed or your message.");
      return;
    }

    setMsgSending(true);
    try {
      await api.sendMessage({
        type: msgType,
        itemNeeded: msgItemNeeded.trim(),
        content: msgContent.trim(),
        department: assignedDept,
      });
      setMsgSuccess(t ? t("noteSentSuccess") : "Note sent to Admin successfully!");
      setMsgItemNeeded("");
      setMsgContent("");
      loadNotices();
      setTimeout(() => {
        setMsgSuccess("");
        setShowMsgComposer(false);
      }, 2000);
    } catch (err) {
      setMsgError(err.message || "Could not send note");
    } finally {
      setMsgSending(false);
    }
  }

  function getDeptLabel(dept) {
    if (!t) return dept;
    if (dept === "Color") return t("deptColor");
    if (dept === "Drying") return t("deptDrying");
    if (dept === "Roll") return t("deptRoll");
    return dept;
  }

  function getStatusLabel(status) {
    if (!t) return status;
    if (status === "OK") return t("statusOk");
    if (status === "Pending") return t("statusPending");
    if (status === "Issue") return t("statusIssue");
    return status;
  }

  const deptIcons = {
    Color: "🎨",
    Drying: "🌀",
    Roll: "📏",
  };

  const autocompleteProducts = products.filter(
    (p) =>
      p.code.toLowerCase().includes(product.toLowerCase()) &&
      p.code.toLowerCase() !== product.toLowerCase(),
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!product.trim()) {
      setError(t ? t("enterProductCode") : "Please enter a product code");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.addEntry({
        product: product.trim(),
        department: assignedDept,
        date,
        quantity,
      });

      if (result.merged) {
        setInfo(
          t
            ? t(
                "mergedNotice",
                result.product,
                getDeptLabel(assignedDept),
                quantity,
                result.quantity,
              )
            : `"${result.product}" already existed for ${assignedDept} on this date - added ${quantity} to it (now ${result.quantity}).`,
        );
      }

      setProduct("");
      setQuantity(1);
      reloadProducts();
      reloadSubmissions();
    } catch (err) {
      setError(err.message || (t ? t("couldNotSubmit") : "Could not submit entry"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="worker-canvas">
      {/* Big Employee Name Header */}
      <div className="worker-big-name-banner card">
        <div className="worker-banner-avatar">
          {user?.profilePicture?.startsWith("emoji:") ? (
            <span style={{ fontSize: 36 }}>{user.profilePicture.replace("emoji:", "")}</span>
          ) : user?.profilePicture ? (
            <img src={user.profilePicture} alt={user?.fullName} className="worker-banner-avatar-img" />
          ) : (
            <span className="avatar worker-banner-avatar-fallback">
              {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "W"}
            </span>
          )}
        </div>
        <div className="worker-banner-details">
          <h1 className="worker-big-name-text">
            {user?.fullName || user?.username || "Employee"}
          </h1>
          <div className="worker-banner-badges">
            <span className="worker-id-badge">{user?.displayId}</span>
            <span className={`badge ${badgeClass(assignedDept)}`}>
              {deptIcons[assignedDept]} {getDeptLabel(assignedDept)}
            </span>
          </div>
        </div>

        {/* Quick Send Note to Admin & Logout Buttons */}
        <div className="worker-banner-action" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActiveTab("notices");
              setShowMsgComposer(true);
            }}
          >
            💬 {t ? t("sendMessageToAdmin") : "Send Note to Admin"}
          </button>

          {onLogout && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
              onClick={onLogout}
              title={t ? t("signOut") : "Sign out"}
            >
              ⏻ {t ? t("signOut") : "Sign out"}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Switcher between Work Form and Group Notices */}
      <div className="worker-tab-nav-row">
        <button
          type="button"
          className={`worker-tab-nav-btn ${activeTab === "form" ? "active" : ""}`}
          onClick={() => setActiveTab("form")}
        >
          📝 {t ? t("workEntry") : "Work Entry"}
        </button>
        <button
          type="button"
          className={`worker-tab-nav-btn ${activeTab === "notices" ? "active" : ""}`}
          onClick={() => setActiveTab("notices")}
        >
          📢 {t ? t("noticesAndMeetings") : "Notices & Meetings"}
          {messages.length > 0 && <span className="worker-tab-badge">{messages.length}</span>}
        </button>
      </div>

      {/* 1. NOTICES & MEETINGS TAB */}
      {activeTab === "notices" && (
        <div className="worker-notices-section">
          {/* Note Composer Modal / Inline */}
          {showMsgComposer && (
            <div className="card worker-msg-composer-card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>💬 {t ? t("lackOfSomething") : "Lack of materials or urgent note for Admin?"}</span>
                <button type="button" className="icon-btn" onClick={() => setShowMsgComposer(false)}>✕</button>
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="msg-type-selector">
                  <button
                    type="button"
                    className={`msg-type-chip ${msgType === "SHORTAGE" ? "active shortage" : ""}`}
                    onClick={() => setMsgType("SHORTAGE")}
                  >
                    {t ? t("shortageTag") : "🚨 Lack of Material"}
                  </button>
                  <button
                    type="button"
                    className={`msg-type-chip ${msgType === "ISSUE" ? "active issue" : ""}`}
                    onClick={() => setMsgType("ISSUE")}
                  >
                    {t ? t("issueTag") : "⚠️ Floor Issue"}
                  </button>
                  <button
                    type="button"
                    className={`msg-type-chip ${msgType === "NOTE" ? "active note" : ""}`}
                    onClick={() => setMsgType("NOTE")}
                  >
                    {t ? t("generalTag") : "📝 General Note"}
                  </button>
                </div>

                {msgType === "SHORTAGE" && (
                  <div className="field" style={{ marginTop: 12 }}>
                    <label>📦 {t ? t("itemNeeded") : "Material / Item Needed *"}</label>
                    <input
                      placeholder={t ? t("itemNeededPlaceholder") : "e.g. Blue ink, drying paper, rolls…"}
                      value={msgItemNeeded}
                      onChange={(e) => setMsgItemNeeded(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}

                <div className="field" style={{ marginTop: 12 }}>
                  <label>📝 {t ? t("messageNote") : "Message / Details"}</label>
                  <textarea
                    rows={3}
                    placeholder={t ? t("messagePlaceholder") : "Describe what you lack or your note for the admin…"}
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "var(--card-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                {msgError && <div className="error-text">⚠️ {msgError}</div>}
                {msgSuccess && <div className="info-text">✓ {msgSuccess}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={msgSending}
                    style={{ flex: 1 }}
                  >
                    {msgSending ? (t ? t("sendingNote") : "Sending…") : (t ? t("sendNoteBtn") : "➤ Send to Admin")}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowMsgComposer(false)}
                  >
                    {t ? t("cancel") : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notices Feed */}
          {messages.length === 0 ? (
            <div className="card empty-messages-box">
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{t ? t("noNoticesYet") : "No announcements or meeting notices yet"}</div>
            </div>
          ) : (
            <div className="messages-feed">
              {messages.map((m) => {
                const isMeeting = m.type === "MEETING";
                const isShortage = m.type === "SHORTAGE";
                const comments = m.comments || [];

                return (
                  <div
                    key={m.id}
                    className={`msg-card ${isMeeting ? "msg-card-meeting" : isShortage ? "msg-card-shortage" : ""}`}
                  >
                    {/* Meeting Banner */}
                    {isMeeting && (
                      <div className="meeting-banner-row">
                        <div className="meeting-date-pill">
                          📅 {t ? t("nextMeeting") : "Next Meeting"}: <strong>{m.meetingDate || "Date to be announced"}</strong>
                        </div>
                        <span className="badge badge-accent">👥 {m.department === "ALL" ? (t ? t("allMembers") : "All Group") : m.department}</span>
                      </div>
                    )}

                    <div className="msg-header-row">
                      <div className="msg-sender-info">
                        <span className="avatar" style={{ width: 32, height: 32, fontSize: 16 }}>
                          {isMeeting ? "📅" : isShortage ? "🚨" : "📢"}
                        </span>
                        <div>
                          <div className="msg-sender-name">
                            {m.senderName} {m.senderDisplayId && <span className="msg-sender-id">({m.senderDisplayId})</span>}
                          </div>
                          <div className="msg-meta-row">
                            <span className={`badge ${badgeClass(m.department)} msg-dept-tag`}>
                              {m.department}
                            </span>
                            <span className="msg-timestamp">{m.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-default">{m.type}</span>
                    </div>

                    {m.title && <h3 className="msg-title-text">{m.title}</h3>}
                    {isShortage && m.itemNeeded && (
                      <div className="msg-item-alert">
                        <strong>{t ? t("itemNeeded") : "Item Needed"}:</strong> {m.itemNeeded}
                      </div>
                    )}

                    <div className="msg-body-content">{m.content}</div>

                    {m.adminReply && (
                      <div className="msg-admin-reply-box">
                        <div className="admin-reply-title">🏢 {t ? t("adminReplyLabel") : "Admin Reply"}:</div>
                        <div className="admin-reply-text">{m.adminReply}</div>
                      </div>
                    )}

                    {/* Social Toolbar */}
                    <div className="msg-action-toolbar">
                      <div className="msg-social-actions">
                        <button
                          type="button"
                          className={`btn-like ${m.likedByMe ? "liked" : ""}`}
                          onClick={() => handleToggleLike(m.id)}
                        >
                          <span className="like-heart">{m.likedByMe ? "❤️" : "🤍"}</span>
                          <span className="like-label">{m.likedByMe ? (t ? t("liked") : "Liked") : (t ? t("like") : "Like")}</span>
                          {m.likesCount > 0 && <span className="like-counter">{m.likesCount}</span>}
                        </button>

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
                    </div>

                    {/* Comment Section */}
                    {(showCommentBox[m.id] || comments.length > 0) && (
                      <div className="msg-comment-section">
                        {comments.length > 0 && (
                          <div className="comment-list">
                            {comments.map((c) => (
                              <div key={c.id} className="comment-item">
                                <span className="comment-author-avatar">👤</span>
                                <div className="comment-bubble">
                                  <div className="comment-author-name">
                                    {c.authorName} {c.authorDisplayId && <small style={{ color: "var(--text-muted)" }}>({c.authorDisplayId})</small>}
                                    <span className="comment-time">{c.createdAt}</span>
                                  </div>
                                  <div className="comment-text">{c.text}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

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
        </div>
      )}

      {/* 2. PRODUCTION ENTRY FORM TAB */}
      {activeTab === "form" && (
        <>
          <div className="card worker-form-card">
            <div className="card-title">
              📝 {t ? t("productForm") : "Product Entry"}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>{t ? t("department") : "DEPARTMENT"}</label>
                <div className="worker-assigned-dept-box">
                  <span className="worker-dept-badge">
                    <span style={{ fontSize: 18 }}>{deptIcons[assignedDept] || "🏢"}</span>
                    <strong>{getDeptLabel(assignedDept)}</strong>
                  </span>
                  <span className="worker-dept-lock-note">
                    🔒 {t ? t("assigned") || "Assigned Department" : "Assigned Department"}
                  </span>
                </div>
              </div>

              <div className="field autocomplete">
                <label>{t ? t("searchProduct") : "Search for product"}</label>
                <input
                  placeholder={t ? t("searchProductPlaceholder") : "Type to search or add new…"}
                  value={product}
                  onChange={(e) => {
                    setProduct(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                />
                {showSuggestions && autocompleteProducts.length > 0 && (
                  <div className="autocomplete-list">
                    {autocompleteProducts.slice(0, 20).map((p) => (
                      <div
                        key={p.id}
                        className="autocomplete-item"
                        onMouseDown={() => {
                          setProduct(p.code);
                          setShowSuggestions(false);
                        }}
                      >
                        {p.code}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label>{t ? t("quantity") : "Quantity"}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>{t ? t("date") : "Date"}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {error && <div className="error-text">⚠️ {error}</div>}
              {info && <div className="info-text">{info}</div>}

              <button className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? (t ? t("submitting") : "Submitting…") : (t ? t("submit") : "➤ Submit")}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-title">
              📋 {t ? t("mySubmissions") : "My Submissions"}
            </div>
            <table>
              <thead>
                <tr>
                  <th>{t ? t("product") : "Product"}</th>
                  <th>{t ? t("qty") : "Qty"}</th>
                  <th>{t ? t("date") : "Date"}</th>
                  <th>{t ? t("status") : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={4}>{t ? t("noSubmissionsYet") : "No submissions yet"}</td>
                  </tr>
                )}
                {mySubmissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="product-code">{s.product}</span>
                    </td>
                    <td>
                      <span className="qty-pill">{s.quantity}</span>
                    </td>
                    <td>{formatDate(s.date)}</td>
                    <td>
                      <span className={`badge ${badgeClass(s.status)}`}>
                        {getStatusLabel(s.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
