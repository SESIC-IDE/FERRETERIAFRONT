import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./Productos.css";

/* Hook pequeño para tema */
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    if (theme === "light") root.classList.add("theme-light");
    else if (theme === "dark") root.classList.add("theme-dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, setTheme];
}

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [sort, setSort] = useState("nombre");
  const [theme, setTheme] = useTheme();

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  // Carga de productos
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    api
      .get("/productos", { signal: ctrl.signal })
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch((e) => {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr(e?.response?.data?.error || e.message || "Error al cargar productos");
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  // Categorías únicas
  const categorias = useMemo(() => {
    const set = new Set(
      productos
        .map((p) => (p?.categoria ?? "").toString().trim())
        .filter((x) => x.length > 0)
    );
    return ["todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [productos]);

  const nf = useMemo(
    () => new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }),
    []
  );

  // Filtrado + orden
  const data = useMemo(() => {
    let list = productos;
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((p) =>
        `${p?.nombre ?? ""} ${p?.categoria ?? ""}`.toLowerCase().includes(t)
      );
    }
    if (cat !== "todas") list = list.filter((p) => (p?.categoria ?? "") === cat);

    return [...list].sort((a, b) => {
      if (sort === "nombre") return (a?.nombre ?? "").localeCompare(b?.nombre ?? "");
      if (sort === "precio") return Number(a?.precio ?? 0) - Number(b?.precio ?? 0);
      if (sort === "stock") return Number(a?.stock ?? 0) - Number(b?.stock ?? 0);
      return 0;
    });
  }, [productos, q, cat, sort]);

  return (
    <div className="fx-wrap">
      {/* Cabecera principal con título y selector de tema */}
      <div className="fx-topbar">
        <div className="fx-title">
          <h1>Inventario</h1>
          <p>Listado de productos</p>
        </div>
        <div className="fx-theme">
          <select
            className="fx-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            aria-label="Tema de la interfaz"
          >
            <option value="system">Automático</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>
      </div>

      {/* Controles de búsqueda y orden */}
      <div className="fx-controls" role="group" aria-label="Controles de inventario">
        <input
          className="fx-input"
          placeholder="Buscar por nombre o categoría…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          aria-label="Buscar productos"
          autoComplete="off"
        />

        <select
          className="fx-select"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c === "todas" ? "Todas las categorías" : c}
            </option>
          ))}
        </select>

        <select
          className="fx-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Ordenar resultados"
        >
          <option value="nombre">Orden: Nombre</option>
          <option value="precio">Orden: Precio</option>
          <option value="stock">Orden: Stock</option>
        </select>
      </div>

      {/* Mensajes */}
      {err && (
        <div className="fx-alert" role="alert">
          <span>⚠️ {err}</span>
        </div>
      )}

      {/* Grid de productos */}
      {loading ? (
        <div className="fx-grid" aria-busy="true" aria-live="polite">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="fx-card fx-skeleton" />
          ))}
        </div>
      ) : (
        <div className="fx-grid">
          {data.map((p) => (
            <article
              key={p.id ?? `${p.nombre}-${p.categoria}-${p.precio}`}
              className="fx-card"
            >
              <div className="fx-card-top">
                <div className="fx-chip">{p?.categoria || "Sin categoría"}</div>
                <div className={`fx-stock ${Number(p?.stock ?? 0) > 0 ? "ok" : "low"}`}>
                  {Number(p?.stock ?? 0) > 0 ? `${p.stock} en stock` : "Sin stock"}
                </div>
              </div>

              <h3 className="fx-name">{p?.nombre ?? "Producto"}</h3>

              <div className="fx-meta">
                <div className="fx-price">{nf.format(Number(p?.precio ?? 0))}</div>
              </div>

              <div className="fx-actions">
                <button className="fx-btn ghost" type="button">
                  Detalles
                </button>
                <button className="fx-btn" type="button">
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !err && data.length === 0 && (
        <div className="fx-empty" role="status">
          <p>Sin resultados. Ajusta tu búsqueda o filtros.</p>
        </div>
      )}
    </div>
  );
}
