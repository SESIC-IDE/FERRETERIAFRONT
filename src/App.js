import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Productos from "./pages/Productos";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Productos />} />
      </Routes>
    </Router>
  );
}

export default App;