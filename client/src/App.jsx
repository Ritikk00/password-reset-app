import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-blur">
        <div className="container">
          <Link className="navbar-brand fw-semibold" to="/">
            <i className="bi bi-shield-lock me-2"></i>
            Password Reset
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
