import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function ProductsTab({ t, onProductAdded }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const data = await api.listProducts();
      setProducts(data);
      if (onProductAdded) onProductAdded(data);
    } catch {
      /* ignore */
    }
  }

  async function addProduct(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!code.trim()) return;
    try {
      await api.addProduct(code.trim());
      setSuccess(`Product "${code.trim()}" added!`);
      setCode("");
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || (t ? t("couldNotAddProduct") : "Could not add product"));
    }
  }

  const filteredProducts = products.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="products-layout">
      {/* Left side: Product List */}
      <div className="card products-list-card">
        <div className="card-title">
          📦 {t ? t("products") : "Products"} ({filteredProducts.length})
        </div>

        <div className="field">
          <input
            placeholder={t ? t("filterPlaceholder") : "Filter products…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="products-table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>{t ? t("code") : "Code"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={2}>{t ? t("noProductsYet") : "No products yet"}</td>
                </tr>
              )}
              {filteredProducts.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span className="product-code-badge">{p.code}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right side: Add Product Form */}
      <div className="card products-add-card">
        <div className="card-title">
          ➕ {t ? t("addProductCode") : "Add product code"}
        </div>
        <form onSubmit={addProduct}>
          <div className="field">
            <label>{t ? t("code") : "Code"}</label>
            <input
              placeholder={t ? t("codePlaceholder") : "e.g. C-25"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          {success && <div className="info-text">{success}</div>}
          <button className="btn btn-primary btn-block">
            {t ? t("addBtn") : "+ Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
