import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Admin from './Admin';

const App = () => {
  // const [isLogin, setIsLogin] = useState(false);

  const [isLogin, setIsLogin] = useState(() => localStorage.getItem('isLogin') === 'true');

  useEffect(() => {
    // 登录状态变化时同步到 localStorage
    if (isLogin) {
      localStorage.setItem('isLogin', 'true');
    } else {
      localStorage.removeItem('isLogin');
    }
  }, [isLogin]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<Login onLogin={() => setIsLogin(true)} />}
        />
        <Route
          path="/Admin"
          element={
            isLogin ? <Admin /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
};
export default App;