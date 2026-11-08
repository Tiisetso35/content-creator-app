import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ContentDetail from './pages/ContentDetail.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return (
    <>
      <header className="top">
        <div className="wrap row">
          <Link to="/" className="brand">Creator Hub</Link>
          <Link to="/admin" className="small-link">Creator login</Link>
        </div>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="*" element={<p className="msg">Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
