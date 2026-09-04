import { useState, useEffect } from "react";
import Login from "./components/Login";
import WorkerForm from "./components/WorkerForm";
import AdminDashboard from "./components/AdminDashboard";
import ProfileModal from "./components/ProfileModal";
import Sidebar from "./components/Sidebar";
import { api, loadSession, clearSession } from "./api/api";
import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredTheme,
  setStoredTheme,
  createTranslator,
} from "./i18n/i18n";

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
        <header className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-btn icon-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <div className="mobile-brand-title">
            {user.role === "ADMIN" ? user.companyName : user.fullName || user.username}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsProfileOpen(true)}
            title={t("profileSettings")}
          >
            👤
          </button>
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
