import React, { useEffect, useState } from "react";
import api from "../services/api";

function Productos() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Listado de Productos</h1>
      <ul>
        {productos.map((p) => (
          <li key={p.id}>
            {p.nombre} - {p.categoria} - {p.stock} en stock - Q{p.precio}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Productos;
