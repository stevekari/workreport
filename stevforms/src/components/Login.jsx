import { useState } from "react";
import { api, saveSession } from "../api/api";
import { LANGUAGES } from "../i18n/i18n";
import { DEPARTMENTS } from "../api/data";
import kariLogo from "../assets/kari.png";

export default function Login({
  onLoggedIn,
  t,
  lang,
  onLangChange,
  theme,
  onThemeChange,
}) {
  const [portal, setPortal] = useState("employee"); // 'employee' | 'admin'
  const [mode, setMode] = useState("signin"); // 'signin' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign In inputs
  const [usernameOrId, setUsernameOrId] = useState("");
  const [password, setPassword] = useState("");

  // Company Admin Registration inputs
  const [companyName, setCompanyName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Employee Registration inputs
  const [empCompanyIdOrName, setEmpCompanyIdOrName] = useState("");
  const [empFullName, setEmpFullName] = useState("");
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empDepartment, setEmpDepartment] = useState("Color");

  function getDeptLabel(dept) {
    if (!t) return dept;
    if (dept === "Color") return t("deptColor");
    if (dept === "Drying") return t("deptDrying");
    if (dept === "Roll") return t("deptRoll");
    return dept;
  }

  // Handle Sign In (Employee or Admin)
  async function handleSignIn(e) {
    e.preventDefault();
    setError("");

    if (!usernameOrId.trim()) {
      setError(t("enterNameOrIdError"));
      return;
    }

    setLoading(true);
    try {
      const auth = await api.login({
        usernameOrId: usernameOrId.trim(),
        password: password.trim(),
      });
      saveSession(auth);
      onLoggedIn(auth);
    } catch (err) {
      setError(
        err.message || t("signInFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle Company Registration (Admin)
  async function handleRegisterCompany(e) {
    e.preventDefault();
    setError("");

    if (!companyName.trim() || !adminUsername.trim() || !adminPassword.trim()) {
      setError(t("allCompanyFieldsError"));
      return;
    }

    setLoading(true);
    try {
      const auth = await api.registerCompany({
        companyName: companyName.trim(),
        adminUsername: adminUsername.trim(),
        adminPassword: adminPassword.trim(),
      });
      saveSession(auth);
      onLoggedIn(auth);
    } catch (err) {
      setError(err.message || t("registerFailed"));
    } finally {
      setLoading(false);
    }
  }

  // Handle Employee Registration (Must provide verified Company ID!)
  async function handleRegisterEmployee(e) {
    e.preventDefault();
    setError("");

    if (!empCompanyIdOrName.trim()) {
      setError(t("companyIdRequiredError"));
      return;
    }
    if (!empFullName.trim()) {
      setError(t("fullNameMissingError"));
      return;
    }
    if (!empUsername.trim()) {
      setError(t("usernameMissingError"));
      return;
    }
    if (!empPassword.trim()) {
      setError(t("passwordMissingError"));
      return;
    }

    setLoading(true);
    try {
      const auth = await api.registerEmployee({
        companyIdOrCode: empCompanyIdOrName.trim(),
        fullName: empFullName.trim(),
        username: empUsername.trim(),
        password: empPassword.trim(),
        department: empDepartment,
      });
      saveSession(auth);
      onLoggedIn(auth);
    } catch (err) {
      setError(err.message || t("registerFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      {/* Top right floating toolbar for theme and language */}
      {onLangChange && onThemeChange && (
        <div className="login-top-controls">
          <select
            className="lang-select"
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
      )}

      <div className="login-brand">
        <div className="brand-logo">
          <img
            className="logo-st"
            src={kariLogo}
            alt="SteveFlow"
            style={{ width: 48, height: 48, borderRadius: 10 }}
          />
        </div>
        <div>
          <div className="brand-title">{t("appTitle")}</div>
          <div className="brand-subtitle">
            {portal === "employee" ? `👷 ${t("employeePortal")}` : `🏢 ${t("companyManagement")}`}
          </div>
        </div>
      </div>

      <div className="card login-card">
        {/* Portal Switcher: Employee vs Company Admin */}
        <div className="login-portal-nav">
          <button
            type="button"
            className={`login-portal-btn ${portal === "employee" ? "active" : ""}`}
            onClick={() => {
              setPortal("employee");
              setMode("signin");
              setError("");
            }}
          >
            👷 {t("employee")}
          </button>
          <button
            type="button"
            className={`login-portal-btn ${portal === "admin" ? "active" : ""}`}
            onClick={() => {
              setPortal("admin");
              setMode("signin");
              setError("");
            }}
          >
            🏢 {t("companyAdmin")}
          </button>
        </div>

        {/* Sub-modes: Sign In vs Register */}
        <div className="btn-row" style={{ marginTop: 12, marginBottom: 16 }}>
          <button
            type="button"
            className={`btn ${mode === "signin" ? "btn-active" : ""}`}
            onClick={() => {
              setMode("signin");
              setError("");
            }}
          >
            {t("signIn")}
          </button>
          <button
            type="button"
            className={`btn ${mode === "register" ? "btn-active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            {portal === "employee" ? t("registerEmployee") : t("registerCompany")}
          </button>
        </div>

        {error && (
          <div className="error-text">
            ⚠️ {error}
            {error.toLowerCase().includes("already registered") && mode === "register" && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                >
                  👉 {t("signIn")}
                </button>
              </div>
            )}
          </div>
        )}
        {/* 1. EMPLOYEE PORTAL */}
        {portal === "employee" && mode === "signin" && (
          <form onSubmit={handleSignIn}>
            <div className="field">
              <label>👤 {t("employeeNameOrId")}</label>
              <input
                placeholder={t("employeeNameOrIdPlaceholder")}
                value={usernameOrId}
                onChange={(e) => setUsernameOrId(e.target.value)}
                required
                autoFocus
              />
              <small style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, display: "block" }}>
                {t("loginHelperNote")}
              </small>
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input
                type="password"
                placeholder={t("loginPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-block btn-primary" disabled={loading}>
              {loading ? t("signingIn") : t("employeeSignIn")}
            </button>
          </form>
        )}

        {portal === "employee" && mode === "register" && (
          <form onSubmit={handleRegisterEmployee}>
            <div className="field">
              <label>🔑 {t("companyIdLabel")}</label>
              <input
                placeholder={t("companyIdPlaceholder")}
                value={empCompanyIdOrName}
                onChange={(e) => setEmpCompanyIdOrName(e.target.value)}
                required
                autoFocus
              />
              <small style={{ color: "var(--accent)", fontSize: 11, marginTop: 4, display: "block", fontWeight: 600 }}>
                {t("companyIdSecurityNote")}
              </small>
            </div>

            <div className="field">
              <label>👤 {t("fullNameRequired")}</label>
              <input
                placeholder="e.g. John Doe"
                value={empFullName}
                onChange={(e) => setEmpFullName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>🏢 {t("departmentRequired")}</label>
              <select
                value={empDepartment}
                onChange={(e) => setEmpDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {getDeptLabel(d)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>🏷️ {t("usernameRequired")}</label>
              <input
                placeholder="e.g. johndoe"
                value={empUsername}
                onChange={(e) => setEmpUsername(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>🔑 {t("password")} *</label>
              <input
                type="password"
                placeholder={t("createPasswordPlaceholder")}
                value={empPassword}
                onChange={(e) => setEmpPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-block btn-primary" disabled={loading}>
              {loading ? t("registering") : t("joinCompany")}
            </button>
          </form>
        )}

        {/* 2. ADMIN PORTAL */}
        {portal === "admin" && mode === "signin" && (
          <form onSubmit={handleSignIn}>
            <div className="field">
              <label>👑 {t("adminUsernameOrId")}</label>
              <input
                placeholder={t("adminUsernameOrIdPlaceholder")}
                value={usernameOrId}
                onChange={(e) => setUsernameOrId(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input
                type="password"
                placeholder={t("loginPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-block btn-primary" disabled={loading}>
              {loading ? t("signingIn") : t("adminSignIn")}
            </button>
          </form>
        )}

        {portal === "admin" && mode === "register" && (
          <form onSubmit={handleRegisterCompany}>
            <div className="field">
              <label>{t("companyName")}</label>
              <input
                placeholder={t("companyNamePlaceholder")}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>{t("adminUsername")}</label>
              <input
                placeholder={t("adminUsernamePlaceholder")}
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>{t("adminPassword")}</label>
              <input
                type="password"
                placeholder={t("createPasswordPlaceholder")}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-block btn-primary" disabled={loading}>
              {loading ? t("creating") : t("createCompanyBtn")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
