import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import React from "react";
import HomePage from "./HomePage";
import ResultPage from "./ResultPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}

export default App;
