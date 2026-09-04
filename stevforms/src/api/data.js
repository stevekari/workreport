export const DEPARTMENTS = ["Color", "Drying", "Roll"];

export const DEPARTMENTSLABELS = [
  { key: "Color", label: "Color", icon: "🎨" },
  { key: "Drying", label: "Drying", icon: "🌀" },
  { key: "Roll", label: "Roll", icon: "📏" },
];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function badgeClass(dept) {
  if (dept === "Color") return "badge badge-color";
  if (dept === "Drying") return "badge badge-drying";
  return "badge badge-roll";
}
export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
