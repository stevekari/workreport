import { useEffect, useState } from "react";
import { badgeClass, DEPARTMENTS, formatDate } from "../api/data";
import { api } from "../api/api";

export default function EntriesTab({
  t,
  initialFilter = "",
  deptFilter = "",
  onDeptFilterChange,
  onEntriesLoaded,
}) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("");
  const [prevInitialFilter, setPrevInitialFilter] = useState(initialFilter);
  const [localDeptFilter, setLocalDeptFilter] = useState(deptFilter);
  const [prevDeptFilter, setPrevDeptFilter] = useState(deptFilter);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  if (initialFilter !== prevInitialFilter) {
    setPrevInitialFilter(initialFilter);
    setFilter(initialFilter);
  }

  if (deptFilter !== prevDeptFilter) {
    setPrevDeptFilter(deptFilter);
    setLocalDeptFilter(deptFilter);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const data = await api.listEntries();
      setEntries(data || []);
      if (onEntriesLoaded) onEntriesLoaded(data || []);
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

  function getStatusLabel(status) {
    if (!t) return status;
    if (status === "OK") return t("statusOk");
    if (status === "Pending") return t("statusPending");
    if (status === "Issue") return t("statusIssue");
    return status;
  }

  const renderWorkerAvatar = (e) => {
    if (!e.workerProfilePicture) {
      return (
        <span className="avatar">
          {e.workerName?.[0]?.toUpperCase() || "W"}
        </span>
      );
    }
    if (e.workerProfilePicture.startsWith("emoji:")) {
      return (
        <span className="avatar" style={{ fontSize: 16 }}>
          {e.workerProfilePicture.replace("emoji:", "")}
        </span>
      );
    }
    return (
      <img
        src={e.workerProfilePicture}
        alt={e.workerName}
        className="avatar"
        style={{ objectFit: "cover" }}
      />
    );
  };

  const visible = entries.filter((e) => {
    const text = `${e.workerName} ${e.product} ${e.workerDisplayId || ""}`.toLowerCase();
    const matchesText = text.includes(filter.toLowerCase());
    const matchesDept = !localDeptFilter || e.department === localDeptFilter;
    return matchesText && matchesDept;
  });

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditDraft({
      product: entry.product,
      department: entry.department,
      date: entry.date,
      status: entry.status,
      quantity: entry.quantity,
    });
  }

  async function saveEdit(id) {
    try {
      await api.updateEntry(id, editDraft);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm(t ? t("deleteConfirmEntry") : "Delete this entry?")) return;
    try {
      await api.deleteEntry(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="card">
      <div className="field">
        <input
          placeholder={t ? t("filterPlaceholder") : "Filter by name, ID or product…"}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="field">
        <select
          value={localDeptFilter}
          onChange={(e) => {
            setLocalDeptFilter(e.target.value);
            if (onDeptFilterChange) onDeptFilterChange(e.target.value);
          }}
        >
          <option value="">{t ? t("allDepartments") : "All departments"}</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {getDeptLabel(d)}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>{t ? t("worker") : "Worker"}</th>
            <th>{t ? t("product") : "Product"}</th>
            <th>{t ? t("dept") : "Dept"}</th>
            <th>{t ? t("qty") : "Qty"}</th>
            <th>{t ? t("date") : "Date"}</th>
            <th>{t ? t("status") : "Status"}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 && (
            <tr className="empty-row">
              <td colSpan={7}>{t ? t("noEntriesYet") : "No entries yet"}</td>
            </tr>
          )}
          {visible.map((e) => (
            <tr key={e.id}>
              <td>
                <span className="worker-cell">
                  {renderWorkerAvatar(e)}
                  <span>
                    <strong>{e.workerName}</strong>
                    {e.workerDisplayId && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {e.workerDisplayId}
                      </span>
                    )}
                  </span>
                </span>
              </td>

              {editingId === e.id ? (
                <>
                  <td>
                    <input
                      value={editDraft.product}
                      onChange={(ev) =>
                        setEditDraft({ ...editDraft, product: ev.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editDraft.department}
                      onChange={(ev) =>
                        setEditDraft({
                          ...editDraft,
                          department: ev.target.value,
                        })
                      }
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
                      type="number"
                      min="1"
                      value={editDraft.quantity}
                      onChange={(ev) =>
                        setEditDraft({
                          ...editDraft,
                          quantity: Number(ev.target.value),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editDraft.date}
                      onChange={(ev) =>
                        setEditDraft({ ...editDraft, date: ev.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editDraft.status}
                      onChange={(ev) =>
                        setEditDraft({ ...editDraft, status: ev.target.value })
                      }
                    >
                      <option value="OK">{t ? t("statusOk") : "OK"}</option>
                      <option value="Pending">{t ? t("statusPending") : "Pending"}</option>
                      <option value="Issue">{t ? t("statusIssue") : "Issue"}</option>
                    </select>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => saveEdit(e.id)}>
                      ✔
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setEditingId(null)}
                    >
                      ✕
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{e.product}</td>
                  <td>
                    <span className={badgeClass(e.department)}>
                      {getDeptLabel(e.department)}
                    </span>
                  </td>
                  <td>{e.quantity}</td>
                  <td>{formatDate(e.date)}</td>
                  <td>
                    <span className="status-ok">✓ {getStatusLabel(e.status)}</span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => startEdit(e)}>
                      ✎
                    </button>
                    <button className="icon-btn" onClick={() => remove(e.id)}>
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
