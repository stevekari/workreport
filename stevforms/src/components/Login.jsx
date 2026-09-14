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

  // Password visibility states
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [showEmpRegPass, setShowEmpRegPass] = useState(false);
  const [showAdminRegPass, setShowAdminRegPass] = useState(false);

  // Sign In inputs
  const [usernameOrId, setUsernameOrId] = useState("");
  const [password, setPassword] = useState("");

  // Company Admin Registration inputs (Only Company creates email on initial registration)
  const [companyName, setCompanyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
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
    if (!password) {
      setError(t("passwordMissingError"));
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

  // Handle Company Registration (Admin - creates email for company)
  async function handleRegisterCompany(e) {
    e.preventDefault();
    setError("");

    if (!companyName.trim() || !adminUsername.trim() || !adminPassword.trim() || !adminEmail.trim()) {
      setError(t("allCompanyFieldsError"));
      return;
    }
    if (adminPassword.trim().length < 6) {
      setError(t("passwordMinLength") || "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const auth = await api.registerCompany({
        companyName: companyName.trim(),
        email: adminEmail.trim(),
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

  // Handle Employee Registration (Must provide verified Company ID - no email required)
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
    if (empPassword.trim().length < 6) {
      setError(t("passwordMinLength") || "Password must be at least 6 characters long.");
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
      setError(err.message || "Registration failed. Please check company ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-fullscreen-wrap">
      <div className="login-card card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <img src={kariLogo} alt="SteveFlow" className="login-brand-logo" />
          <h1 className="login-brand-title">{t("appTitle")}</h1>
          <p className="login-brand-subtitle">{t("appSubtitle")}</p>
        </div>

        {/* Language & Theme Selector directly inside Form / Card */}
        <div className="login-card-controls">
          <div className="login-card-lang-wrap">
            <span className="login-card-lang-icon" aria-hidden="true">🌐</span>
            <select
              className="login-card-lang-select"
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
          </div>
          <button
            type="button"
            className="icon-btn login-card-theme-btn"
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
            title={t("themeToggle")}
            aria-label={t("themeToggle")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Portal Switcher (Employee vs Company Admin) */}
        <div className="login-portal-switcher">
          <button
            type="button"
            className={`btn ${portal === "employee" ? "btn-primary" : "btn-portal-inactive"}`}
            onClick={() => {
              setPortal("employee");
              setError("");
            }}
          >
            👷 {t("employeePortal")}
          </button>
          <button
            type="button"
            className={`btn ${portal === "admin" ? "btn-primary" : "btn-portal-inactive"}`}
            onClick={() => {
              setPortal("admin");
              setError("");
            }}
          >
            🏢 {t("companyAdmin")}
          </button>
        </div>

        {/* Mode Switcher (Sign In vs Register) */}
        <div className="login-mode-switcher">
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
              <div className="password-input-wrap">
                <input
                  type={showSignInPass ? "text" : "password"}
                  placeholder={t("loginPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowSignInPass(!showSignInPass)}
                  aria-label={showSignInPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                  title={showSignInPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                >
                  {showSignInPass ? "🙈" : "👁️"}
                </button>
              </div>
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
              <small style={{ color: "var(--accent)", fontSize: 11, marginTop: 4, display: "block" }}>
                {t("companyIdSecurityNote")}
              </small>
            </div>
            <div className="field">
              <label>{t("fullNameRequired")}</label>
              <input
                placeholder="e.g. John Doe"
                value={empFullName}
                onChange={(e) => setEmpFullName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>{t("usernameRequired")}</label>
              <input
                placeholder="e.g. jdoe"
                value={empUsername}
                onChange={(e) => setEmpUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <div className="password-input-wrap">
                <input
                  type={showEmpRegPass ? "text" : "password"}
                  placeholder={t("createPasswordPlaceholder")}
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowEmpRegPass(!showEmpRegPass)}
                  aria-label={showEmpRegPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                  title={showEmpRegPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                >
                  {showEmpRegPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="field">
              <label>{t("departmentRequired")}</label>
              <select
                value={empDepartment}
                onChange={(e) => setEmpDepartment(e.target.value)}
                aria-label={t("departmentRequired")}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {getDeptLabel(d)}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-block btn-primary" disabled={loading}>
              {loading ? t("registering") : t("joinCompany")}
            </button>
          </form>
        )}

        {/* 2. COMPANY ADMIN PORTAL */}
        {portal === "admin" && mode === "signin" && (
          <form onSubmit={handleSignIn}>
            <div className="field">
              <label>🏢 {t("adminUsernameOrId")}</label>
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
              <div className="password-input-wrap">
                <input
                  type={showSignInPass ? "text" : "password"}
                  placeholder={t("loginPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowSignInPass(!showSignInPass)}
                  aria-label={showSignInPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                  title={showSignInPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                >
                  {showSignInPass ? "🙈" : "👁️"}
                </button>
              </div>
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
              <label>✉️ {t("companyEmail") || "Company / Admin Email *"}</label>
              <input
                type="email"
                placeholder={t("companyEmailPlaceholder") || "e.g. contact@company.com"}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
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
              <div className="password-input-wrap">
                <input
                  type={showAdminRegPass ? "text" : "password"}
                  placeholder={t("createPasswordPlaceholder")}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowAdminRegPass(!showAdminRegPass)}
                  aria-label={showAdminRegPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                  title={showAdminRegPass ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                >
                  {showAdminRegPass ? "🙈" : "👁️"}
                </button>
              </div>
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
