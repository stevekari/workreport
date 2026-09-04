import { badgeClass, DEPARTMENTS } from "../api/data";

export default function DepartmentCards({
  entries = [],
  workers = [],
  selectedDept = "",
  onSelectDept,
  t,
}) {
  function getDeptLabel(dept) {
    if (!t) return dept;
    if (dept === "Color") return t("deptColor");
    if (dept === "Drying") return t("deptDrying");
    if (dept === "Roll") return t("deptRoll");
    return dept;
  }

  const deptIcons = {
    Color: "🎨",
    Drying: "🌀",
    Roll: "📏",
  };

  return (
    <div className="dept-cards-panel">
      <div className="dept-cards-header">
        <div className="card-title" style={{ margin: 0 }}>
          🏢 {t ? t("allDepartments") : "Departments"}
        </div>
        {selectedDept && (
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, fontSize: 11 }}
            onClick={() => onSelectDept && onSelectDept("")}
            title="Reset department filter"
          >
            ✕
          </button>
        )}
      </div>

      <div className="dept-cards-list">
        {DEPARTMENTS.map((dept) => {
          const deptEntries = entries.filter((e) => e.department === dept);
          const deptWorkers = workers.filter(
            (w) => (w.department || "Color") === dept,
          );
          const totalQty = deptEntries.reduce(
            (sum, e) => sum + (Number(e.quantity) || 1),
            0,
          );
          const okCount = deptEntries.filter((e) => e.status === "OK").length;
          const pendingCount = deptEntries.filter(
            (e) => e.status === "Pending",
          ).length;
          const issueCount = deptEntries.filter(
            (e) => e.status === "Issue",
          ).length;
          const isSelected = selectedDept === dept;

          // Unique products in this department
          const recentItems = Array.from(
            new Set(deptEntries.map((e) => e.product)),
          ).slice(0, 4);

          return (
            <div
              key={dept}
              className={`dept-summary-card ${badgeClass(dept)} ${
                isSelected ? "dept-summary-card-active" : ""
              }`}
              onClick={() =>
                onSelectDept && onSelectDept(isSelected ? "" : dept)
              }
              role="button"
              tabIndex={0}
            >
              {/* Top Row: Icon, Title, and Total Items */}
              <div className="dept-card-top">
                <div className="dept-card-title">
                  <span className="dept-card-icon">{deptIcons[dept]}</span>
                  <strong>{getDeptLabel(dept)}</strong>
                </div>
                <span className="dept-card-qty-badge">
                  {totalQty} {t ? t("qty") : "qty"}
                </span>
              </div>

              {/* Workers assigned to this department */}
              <div className="dept-card-section">
                <div className="dept-section-label">
                  👥 {deptWorkers.length} {t ? t("workers") : "workers"}
                </div>
                <div className="dept-workers-avatars">
                  {deptWorkers.length === 0 ? (
                    <span className="dept-empty-text">None assigned</span>
                  ) : (
                    deptWorkers.slice(0, 4).map((w) => (
                      <span
                        key={w.id}
                        className="avatar dept-worker-avatar"
                        title={`${w.fullName} (${w.displayId})`}
                      >
                        {w.profilePicture?.startsWith("emoji:")
                          ? w.profilePicture.replace("emoji:", "")
                          : w.fullName?.[0]?.toUpperCase() || "W"}
                      </span>
                    ))
                  )}
                  {deptWorkers.length > 4 && (
                    <span className="dept-worker-more">
                      +{deptWorkers.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Products / Items needed in this department */}
              <div className="dept-card-section">
                <div className="dept-section-label">
                  📦 {t ? t("products") : "Items needed"}:
                </div>
                {recentItems.length === 0 ? (
                  <span className="dept-empty-text">No items yet</span>
                ) : (
                  <div className="dept-items-tags">
                    {recentItems.map((prod) => (
                      <span key={prod} className="dept-item-tag">
                        {prod}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status pills */}
              <div className="dept-card-statuses">
                <span className="status-pill status-pill-ok">✓ {okCount}</span>
                {pendingCount > 0 && (
                  <span className="status-pill status-pill-pending">
                    ⏳ {pendingCount}
                  </span>
                )}
                {issueCount > 0 && (
                  <span className="status-pill status-pill-issue">
                    ⚠ {issueCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

