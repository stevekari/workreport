import { useState, useEffect } from "react";
import Login from "./components/Login";
import WorkerForm from "./components/WorkerForm";
import AdminDashboard from "./components/AdminDashboard";
import ProfileModal from "./components/ProfileModal";
import Sidebar from "./components/Sidebar";
import { api, loadSession, clearSession } from "./api/api";
import {
  LANGUAGES,
  getStoredLanguage,
  setStoredLanguage,
  getStoredTheme,
  setStoredTheme,
  createTranslator,
} from "./i18n/i18n";
import kariLogo from "./assets/kari.png";

export default function App() {
  const [user, setUser] = useState(loadSession());
  const [lang, setLang] = useState(getStoredLanguage());
  const [theme, setTheme] = useState(getStoredTheme());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("entries"); // 'entries' | 'workers' | 'products'
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      api
        .getMe()
        .then((freshUser) => {
          if (freshUser) {
            setUser((prev) => ({ ...prev, ...freshUser }));
          }
        })
        .catch(() => {
          // If token in browser is invalid or expired, reset cleanly to login screen
          clearSession();
          setUser(null);
        });

      loadProducts();
      if (user.role === "ADMIN") {
        loadWorkers();
        loadEntries();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadProducts() {
    try {
      const data = await api.listProducts();
      setProducts(data || []);
    } catch {
      /* ignore */
    }
  }

  async function loadWorkers() {
    try {
      const data = await api.listWorkers();
      setWorkers(data || []);
    } catch {
      /* ignore */
    }
  }

  async function loadEntries() {
    try {
      const data = await api.listEntries();
      setEntries(data || []);
    } catch {
      /* ignore */
    }
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    setStoredTheme(newTheme);
  }

  function handleLangChange(newLang) {
    setLang(newLang);
    setStoredLanguage(newLang);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  function handleSelectProduct(code) {
    setSelectedProduct(code);
    setSelectedWorker("");
  }

  function handleSelectWorker(workerName) {
    setSelectedWorker(workerName);
    setSelectedProduct("");
  }

  const t = createTranslator(lang);

  if (!user) {
    return (
      <Login
        onLoggedIn={(u) => {
          setUser(u);
          loadProducts();
          if (u.role === "ADMIN") {
            loadWorkers();
            loadEntries();
          }
        }}
        t={t}
        lang={lang}
        onLangChange={handleLangChange}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workers={workers}
        selectedWorker={selectedWorker}
        onSelectWorker={handleSelectWorker}
        products={products}
        selectedProduct={selectedProduct}
        onSelectProduct={handleSelectProduct}
        t={t}
        lang={lang}
        onLangChange={handleLangChange}
        theme={theme}
        onThemeChange={handleThemeChange}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Middle / Main Content Canvas */}
      <div className="app-main-wrapper">
        <header className="app-top-navbar">
          <div className="top-navbar-left">
            <button
              type="button"
              className="mobile-menu-btn icon-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <div className="top-navbar-brand">
              <img src={kariLogo} alt="SteveFlow" className="top-navbar-logo" />
              <div className="top-navbar-titles">
                <span className="top-navbar-appname">{t("appTitle")}</span>
                <span className="top-navbar-sub">
                  {user.role === "ADMIN" ? (
                    <span className="top-navbar-company-badge">🏢 {user.companyName || "Company"}</span>
                  ) : (
                    <span className="top-navbar-worker-badge">👷 {user.fullName || user.username} ({user.displayId || "Employee"})</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="top-navbar-right">
            {/* Global Language Selector */}
            <select
              className="lang-select top-navbar-lang-select"
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              aria-label={t("language")}
              title={t("language")}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>

            {/* Theme Toggle */}
            <button
              type="button"
              className="icon-btn top-navbar-theme-btn"
              onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
              title={t("themeToggle")}
              aria-label={t("themeToggle")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Profile & Settings button */}
            <button
              type="button"
              className="top-navbar-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              title={t("profileSettings")}
            >
              {user.profilePicture?.startsWith("emoji:") ? (
                <span style={{ fontSize: 16 }}>{user.profilePicture.replace("emoji:", "")}</span>
              ) : user.profilePicture ? (
                <img src={user.profilePicture} alt="" className="avatar" style={{ width: 24, height: 24 }} />
              ) : (
                <span className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                  {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "👤"}
                </span>
              )}
              <span className="top-navbar-username-label">{user.fullName || user.username}</span>
            </button>

            {/* Permanent, Prominent Logout Button (NEVER HIDDEN) */}
            <button
              type="button"
              className="btn btn-outline top-navbar-logout-btn"
              onClick={handleLogout}
              title={t("signOut")}
              aria-label={t("signOut")}
            >
              <span className="logout-icon">⏻</span>
              <span className="logout-text">{t("signOut")}</span>
            </button>
          </div>
        </header>

        <main className="app-middle-canvas">
          {user.role === "ADMIN" ? (
            <AdminDashboard
              t={t}
              tab={activeTab}
              onTabChange={setActiveTab}
              filterProduct={selectedProduct}
              filterWorker={selectedWorker}
              onProductAdded={loadProducts}
              onWorkerAdded={loadWorkers}
              entries={entries}
              workers={workers}
              onEntriesLoaded={setEntries}
            />
          ) : (
            <WorkerForm
              user={user}
              t={t}
              selectedProduct={selectedProduct}
              onProductAdded={loadProducts}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Profile & Settings Modal */}
      {isProfileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onUserUpdated={setUser}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={handleThemeChange}
          lang={lang}
          onLangChange={handleLangChange}
          t={t}
        />
      )}
    </div>
  );
}
