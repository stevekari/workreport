import { useEffect, useState } from "react";
import { api } from "../api/api";
import { badgeClass, DEPARTMENTS } from "../api/data";

export default function WorkersTab({ t, onWorkerAdded }) {
  const [workers, setWorkers] = useState([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Color");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    fullName: "",
    username: "",
    department: "Color",
    password: "",
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const data = await api.listWorkers();
      setWorkers(data || []);
      if (onWorkerAdded) onWorkerAdded(data);
    } catch {
      /* ignore */
    }
  }

  function getDeptLabel(dept) {
    if (!t) return dept;
    if (dept === "Color") return t("deptColor");
    if (dept === "Drying") return t("deptDrying");
    if (dept === "Roll") return t("deptRoll");
    return dept;
  }

  async function addWorker(e) {
    e.preventDefault();
    setError("");
    try {
      await api.addWorker({ fullName, username, password, department });
      setFullName("");
      setUsername("");
      setPassword("");
      setDepartment("Color");
      load();
    } catch (err) {
      setError(err.message || (t ? t("couldNotAddWorker") : "Could not add worker"));
    }
  }

  function startEdit(worker) {
    setEditingId(worker.id);
    setEditDraft({
      fullName: worker.fullName || "",
      username: worker.username || "",
      department: worker.department || "Color",
      password: "",
    });
  }

  async function saveEdit(id) {
    try {
      await api.updateWorker(id, editDraft);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e.message || "Failed to update worker");
    }
  }

  async function removeWorker(id) {
    if (!confirm(t ? t("removeWorkerConfirm") : "Remove this worker? Their login will stop working.")) return;
    try {
      await api.deleteWorker(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="card">
      <div className="card-title">{t ? t("addWorker") : "Add worker"}</div>
      <form
        onSubmit={addWorker}
        className="add-worker-row"
        style={{ marginBottom: 20 }}
      >
        <input
          placeholder={t ? t("fullName") : "Full name"}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          placeholder={t ? t("username") : "Username"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          placeholder={t ? t("password") : "Password"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          aria-label={t ? t("department") : "Department"}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {getDeptLabel(d)}
            </option>
          ))}
        </select>
        <button className="btn btn-primary">{t ? t("addBtn") : "+ Add"}</button>
      </form>
      {error && <div className="error-text">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{t ? t("fullName") : "Full name"}</th>
            <th>{t ? t("department") : "Department"}</th>
            <th>{t ? t("username") : "Username"}</th>
            <th>{t ? t("entriesCount") : "Entries"}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {workers.length === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>{t ? t("noWorkersYet") : "No workers yet"}</td>
            </tr>
          )}
          {workers.map((w) => (
            <tr key={w.id}>
              <td>
                <span className="worker-id-badge">{w.displayId}</span>
              </td>

              {editingId === w.id ? (
                <>
                  <td>
                    <input
                      value={editDraft.fullName}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, fullName: e.target.value })
                      }
                      placeholder={t ? t("fullName") : "Full name"}
                      style={{ minWidth: 120 }}
                      required
                    />
                  </td>
                  <td>
                    <select
                      value={editDraft.department}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, department: e.target.value })
                      }
                      style={{ minWidth: 100 }}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {getDeptLabel(d)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={editDraft.username}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, username: e.target.value })
                      }
                      placeholder={t ? t("username") : "Username"}
                      style={{ minWidth: 100 }}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="password"
                      placeholder="New pass (opt)"
                      value={editDraft.password}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, password: e.target.value })
                      }
                      style={{ minWidth: 110 }}
                    />
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => saveEdit(w.id)}
                      title="Save changes"
                    >
                      ✔
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setEditingId(null)}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>
                    <span className="worker-cell">
                      <span className="avatar">
                        {w.profilePicture?.startsWith("emoji:")
                          ? w.profilePicture.replace("emoji:", "")
                          : w.fullName?.[0]?.toUpperCase() || "W"}
                      </span>
                      <strong>{w.fullName}</strong>
                      <span
                        className={`badge ${badgeClass(w.department || "Color")}`}
                        style={{ marginLeft: 8 }}
                      >
                        {getDeptLabel(w.department || "Color")}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${badgeClass(w.department || "Color")}`}>
                      {getDeptLabel(w.department || "Color")}
                    </span>
                  </td>
                  <td>{w.username}</td>
                  <td>{w.entryCount}</td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => startEdit(w)}
                      title="Edit worker"
                      aria-label="Edit worker"
                    >
                      ✎
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => removeWorker(w.id)}
                      title="Remove worker"
                      aria-label="Remove worker"
                    >
                      🗑
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
