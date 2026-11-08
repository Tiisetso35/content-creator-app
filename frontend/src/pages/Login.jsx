import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const d = await api('/auth/login', { method: 'POST', body: { email, password } });
      localStorage.setItem('token', d.token);
      nav('/admin');
    } catch (er) { setErr(er.message); }
  };
  return (
    <form className="login" onSubmit={submit}>
      <h1>Creator login</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className="btn on">Log in</button>
      {err && <p className="msg err">{err}</p>}
    </form>
  );
}
