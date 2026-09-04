import { useState } from "react";
import EntriesTab from "./EntriesTab";
import WorkersTab from "./WorkersTab";
import ProductsTab from "./ProductsTab";
import MessagesTab from "./MessagesTab";
import DepartmentCards from "./DepartmentCards";

export default function AdminDashboard({
  t,
  tab = "entries",
  onTabChange,
  filterProduct,
  filterWorker,
  onProductAdded,
  onWorkerAdded,
  entries = [],
  workers = [],
  onEntriesLoaded,
}) {
  const [selectedDept, setSelectedDept] = useState("");
  const activeInitialFilter = filterWorker || filterProduct || "";

  function handleSelectDept(dept) {
    setSelectedDept(dept);
    if (tab !== "entries" && onTabChange) {
      onTabChange("entries");
    }
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Middle Main Content */}
      <div className="admin-main-view">
        <div className="admin-tab-nav btn-row">
          <button
            className={`btn ${tab === "entries" ? "btn-active" : ""}`}
            onClick={() => onTabChange && onTabChange("entries")}
          >
            📋 {t ? t("allEntries") : "All entries"}
          </button>
          <button
            className={`btn ${tab === "workers" ? "btn-active" : ""}`}
            onClick={() => onTabChange && onTabChange("workers")}
          >
            👥 {t ? t("workers") : "Workers"}
          </button>
          <button
            className={`btn ${tab === "products" ? "btn-active" : ""}`}
            onClick={() => onTabChange && onTabChange("products")}
          >
            📦 {t ? t("products") : "Products"}
          </button>
          <button
            className={`btn ${tab === "messages" ? "btn-active" : ""}`}
            onClick={() => onTabChange && onTabChange("messages")}
          >
            💬 {t ? t("messages") : "Messages"}
          </button>
        </div>

        <div className="middle-content-canvas">
          {tab === "entries" && (
            <EntriesTab
              t={t}
              initialFilter={activeInitialFilter}
              deptFilter={selectedDept}
              onDeptFilterChange={setSelectedDept}
              onEntriesLoaded={onEntriesLoaded}
            />
          )}
          {tab === "workers" && (
            <WorkersTab t={t} onWorkerAdded={onWorkerAdded} />
          )}
          {tab === "products" && (
            <ProductsTab t={t} onProductAdded={onProductAdded} />
          )}
          {tab === "messages" && (
            <MessagesTab t={t} />
          )}
        </div>
      </div>

      {/* Right Side: Department Cards */}
      <aside className="admin-right-panel">
        <DepartmentCards
          entries={entries}
          workers={workers}
          selectedDept={selectedDept}
          onSelectDept={handleSelectDept}
          t={t}
        />
      </aside>
    </div>
  );
}
