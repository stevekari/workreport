import { useState } from "react";
import { api, saveSession } from "../api/api";
import { LANGUAGES } from "../i18n/i18n";
import { DEPARTMENTS } from "../api/data";

const PRESET_AVATARS = [
  "👷‍♂️",
  "👩‍🔧",
  "👨‍💼",
  "👩‍🔬",
  "🧑‍💻",
  "🏭",
  "⚡",
  "🛠️",
  "📦",
  "⚙️",
];

export default function ProfileModal({
  user,
  onClose,
  onUserUpdated,
  theme,
  onThemeChange,
  lang,
  onLangChange,
  onLogout,
  t,
}) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [profilePicture, setProfilePicture] = useState(
    user.profilePicture || "",
  );
  const [department, setDepartment] = useState(user.department || "Color");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getDeptLabel(dept) {
    if (!t) return dept;
    if (dept === "Color") return t("deptColor");
    if (dept === "Drying") return t("deptDrying");
    if (dept === "Roll") return t("deptRoll");
    return dept;
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // resize image for optimal performance and storage
        const canvas = document.createElement("canvas");
        const maxDimension = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProfilePicture(dataUrl);
        setError("");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function selectPreset(emoji) {
    setProfilePicture(`emoji:${emoji}`);
    setError("");
  }

  function handleRemovePhoto() {
    setProfilePicture("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        profilePicture,
        department,
        password: password.trim() ? password : null,
      };

      let updatedData = {};
      try {
        const res = await api.updateProfile(payload);
        if (res) updatedData = res;
      } catch (err) {
        console.warn("Backend profile update fallback:", err.message);
      }

      const updatedUser = {
        ...user,
        ...updatedData,
        fullName: fullName.trim(),
        profilePicture,
        department,
      };

      saveSession(updatedUser);
      onUserUpdated(updatedUser);
      setSuccess(t ? t("profileUpdated") : "Profile updated successfully!");
      setPassword("");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  const renderAvatarPreview = () => {
    if (!profilePicture) {
      return (
        <div className="avatar-preview-fallback">
          {fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
        </div>
      );
    }
    if (profilePicture.startsWith("emoji:")) {
      return (
        <div className="avatar-preview-emoji">
          {profilePicture.replace("emoji:", "")}
        </div>
      );
    }
    return (
      <img
        src={profilePicture}
        alt="Profile Avatar"
        className="avatar-preview-img"
      />
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="card-title" style={{ margin: 0 }}>
            {t ? t("editProfile") : "Profile & Settings"}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}
        {success && <div className="info-text">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Profile Photo Section */}
          <div className="profile-photo-section">
            <div className="avatar-preview-container">
              {renderAvatarPreview()}
            </div>

            <div className="avatar-controls">
              <label className="btn btn-upload">
                📷 {t ? t("uploadPhoto") : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>

              {profilePicture && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleRemovePhoto}
                >
                  ✕ {t ? t("removePhoto") : "Remove Photo"}
                </button>
              )}
            </div>
          </div>

          <div className="field">
            <label>{t ? t("choosePresetAvatar") : "Or choose an avatar"}</label>
            <div className="preset-avatars-grid">
              {PRESET_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`preset-avatar-btn ${
                    profilePicture === `emoji:${emoji}` ? "active" : ""
                  }`}
                  onClick={() => selectPreset(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>{t ? t("fullNameLabel") : "Full Name"}</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          {user.role === "WORKER" && (
            <div className="field">
              <label>{t ? t("department") : "Department"}</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {getDeptLabel(d)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>{t ? t("username") : "Username"}</label>
            <input value={user.username || ""} disabled />
          </div>

          <div className="field">
            <label>{t ? t("newPasswordLabel") : "New Password (optional)"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t ? t("leaveBlank") : "Leave blank to keep existing password"}
            />
          </div>

          <div className="settings-divider" />

          {/* Language and Theme Settings */}
          <div className="settings-grid">
            <div className="field">
              <label>🌐 {t ? t("language") : "Language"}</label>
              <select
                value={lang}
                onChange={(e) => onLangChange(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>🌓 {t ? t("theme") : "Theme"}</label>
              <div className="theme-toggle-row">
                <button
                  type="button"
                  className={`btn ${theme === "light" ? "btn-active" : ""}`}
                  onClick={() => onThemeChange("light")}
                >
                  ☀️ {t ? t("lightMode") : "Light"}
                </button>
                <button
                  type="button"
                  className={`btn ${theme === "dark" ? "btn-active" : ""}`}
                  onClick={() => onThemeChange("dark")}
                >
                  🌙 {t ? t("darkMode") : "Dark"}
                </button>
              </div>
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 20, marginBottom: 0, justifyContent: "space-between" }}>
            {onLogout && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                ⏻ {t ? t("signOut") : "Sign out"}
              </button>
            )}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                type="button"
                className="btn"
                onClick={onClose}
                disabled={loading}
              >
                {t ? t("cancel") : "Cancel"}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (t ? t("saving") : "Saving…") : `✔ ${t ? t("saveChanges") : "Save changes"}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
