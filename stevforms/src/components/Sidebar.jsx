import { useState } from "react";
import { LANGUAGES } from "../i18n/i18n";
import { badgeClass } from "../api/data";
import kariLogo from "../assets/kari.png";

export default function Sidebar({
  user,
  activeTab,
  onTabChange,
  workers = [],
  selectedWorker,
  onSelectWorker,
  products = [],
  selectedProduct,
  onSelectProduct,
  t,
  lang,
  onLangChange,
  theme,
  onThemeChange,
  onOpenProfile,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) {
  const [sidebarTab, setSidebarTab] = useState("workers"); // 'workers' | 'products'
  const [searchFilter, setSearchFilter] = useState("");

  function getDeptLabel(dept) {
    if (!t) return dept;
    if (dept === "Color") return t("deptColor");
    if (dept === "Drying") return t("deptDrying");
    if (dept === "Roll") return t("deptRoll");
    return dept;
  }

  const filteredWorkers = workers.filter((w) => {
    const text = `${w.fullName || ""} ${w.displayId || ""} ${w.department || ""}`.toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const filteredProducts = products.filter((p) =>
    p.code.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const renderAvatar = (targetUser, className = "sidebar-avatar") => {
    if (!targetUser.profilePicture) {
      return (
        <span className={`avatar ${className}`}>
          {targetUser.fullName?.[0]?.toUpperCase() || targetUser.username?.[0]?.toUpperCase() || "U"}
        </span>
      );
    }
    if (targetUser.profilePicture.startsWith("emoji:")) {
      return (
        <span className={`avatar ${className} sidebar-avatar-emoji`}>
          {targetUser.profilePicture.replace("emoji:", "")}
        </span>
      );
    }
    return (
      <img
        src={targetUser.profilePicture}
        alt={targetUser.fullName || "User"}
        className={`${className} sidebar-avatar-img`}
      />
    );
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`app-sidebar ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <img
            src={kariLogo}
            alt="SteveFlow"
            className="sidebar-logo"
          />
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title big-brand-name">
              {user.role === "ADMIN" ? user.companyName : user.fullName || user.username}
            </div>
            <div className="sidebar-brand-badge">
              {user.role === "ADMIN" ? `👑 ${t("companyAdmin") || "Admin"}` : `👷 ${getDeptLabel(user.department || "Color")}`}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (For Admin) */}
        {user.role === "ADMIN" && (
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "entries" ? "active" : ""}`}
              onClick={() => {
                onTabChange("entries");
                onCloseMobile();
              }}
            >
              <span className="nav-icon">📋</span>
              <span>{t("allEntries")}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "workers" ? "active" : ""}`}
              onClick={() => {
                onTabChange("workers");
                onCloseMobile();
              }}
            >
              <span className="nav-icon">👥</span>
              <span>{t("workers")}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "products" ? "active" : ""}`}
              onClick={() => {
                onTabChange("products");
                onCloseMobile();
              }}
            >
              <span className="nav-icon">📦</span>
              <span>{t("products")}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "messages" ? "active" : ""}`}
              onClick={() => {
                onTabChange("messages");
                onCloseMobile();
              }}
            >
              <span className="nav-icon">💬</span>
              <span>{t("messages")}</span>
            </button>
          </nav>
        )}

        {/* Admin Left Side Switcher: Workers or Products */}
        {user.role === "ADMIN" ? (
          <div className="sidebar-tab-switcher">
            <button
              type="button"
              className={`sidebar-tab-toggle ${sidebarTab === "workers" ? "active" : ""}`}
              onClick={() => {
                setSidebarTab("workers");
                setSearchFilter("");
              }}
            >
              👥 {t("workers")} ({workers.length})
            </button>
            <button
              type="button"
              className={`sidebar-tab-toggle ${sidebarTab === "products" ? "active" : ""}`}
              onClick={() => {
                setSidebarTab("products");
                setSearchFilter("");
              }}
            >
              📦 {t("products")} ({products.length})
            </button>
          </div>
        ) : null}

        {/* Sidebar Middle Section: List of Workers or Products */}
        <div className="sidebar-list-container">
          <div className="sidebar-search-wrap">
            <input
              className="sidebar-search-input"
              placeholder={
                sidebarTab === "workers" && user.role === "ADMIN"
                  ? `${t("fullName")}, ID…`
                  : t("filterPlaceholder")
              }
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {/* Workers List on Left Side */}
          {user.role === "ADMIN" && sidebarTab === "workers" ? (
            <div className="sidebar-items-list">
              {/* Option to show All Workers */}
              <button
                type="button"
                className={`sidebar-worker-item ${!selectedWorker ? "active" : ""}`}
                onClick={() => {
                  if (onSelectWorker) onSelectWorker("");
                  if (onTabChange) onTabChange("entries");
                  onCloseMobile();
                }}
              >
                <span className="worker-item-avatar-wrap">
                  <span className="avatar sidebar-worker-avatar">👥</span>
                </span>
                <div className="sidebar-worker-details">
                  <div className="sidebar-worker-name-row">
                    <span className="sidebar-worker-name">{t("allMembers") || "All Employees"}</span>
                  </div>
                  <div className="sidebar-worker-sub">
                    <span className="sidebar-worker-id">{t("workers") || "Workers"}</span>
                  </div>
                </div>
              </button>

              {filteredWorkers.length === 0 ? (
                <div className="sidebar-empty-products">
                  {t("noWorkersYet")}
                </div>
              ) : (
                filteredWorkers.map((w) => {
                  const isSelected = selectedWorker && selectedWorker.toLowerCase() === w.fullName.toLowerCase();
                  const dept = w.department || "Color";
                  return (
                    <button
                      key={w.id}
                      type="button"
                      className={`sidebar-worker-item ${isSelected ? "active" : ""}`}
                      onClick={() => {
                        if (onSelectWorker) onSelectWorker(w.fullName);
                        if (onTabChange) onTabChange("entries");
                        onCloseMobile();
                      }}
                      title={`${w.fullName} (${w.displayId}) - ${dept}`}
                    >
                      <span className="worker-item-avatar-wrap">
                        {renderAvatar(w, "sidebar-worker-avatar")}
                      </span>
                      <div className="sidebar-worker-details">
                        <div className="sidebar-worker-name-row">
                          <span className="sidebar-worker-name">{w.fullName}</span>
                          <span className={`badge ${badgeClass(dept)} sidebar-dept-badge`}>
                            {getDeptLabel(dept)}
                          </span>
                        </div>
                        <div className="sidebar-worker-sub">
                          <span className="sidebar-worker-id">{w.displayId}</span>
                          <span className="sidebar-worker-entries">
                            {w.entryCount} {t("allEntries").toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* Products List on Left Side */
            <div className="sidebar-items-list">
              {filteredProducts.length === 0 ? (
                <div className="sidebar-empty-products">
                  {t("noProductsYet")}
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct && selectedProduct.toLowerCase() === p.code.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`sidebar-product-item ${isSelected ? "active" : ""}`}
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(p.code);
                        if (user.role === "ADMIN" && onTabChange) {
                          onTabChange("entries");
                        }
                        onCloseMobile();
                      }}
                      title={p.code}
                    >
                      <span className="product-dot">●</span>
                      <span className="product-code">{p.code}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="sidebar-footer">
          {/* Theme & Language row */}
          <div className="sidebar-controls-row">
            <select
              className="lang-select sidebar-lang-select"
              value={lang}
              onChange={(e) => onLangChange(e.target.value)}
              aria-label={t("language")}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="icon-btn"
              onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
              title={t("themeToggle")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>

          {/* User Profile Card */}
          <div
            className="sidebar-user-card"
            onClick={onOpenProfile}
            title={t("profileSettings")}
          >
            {renderAvatar(user)}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user.fullName || user.username}
              </div>
              <div className="sidebar-user-id">{user.displayId}</div>
            </div>
            <button
              type="button"
              className="sidebar-signout-btn"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title={t("signOut")}
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
