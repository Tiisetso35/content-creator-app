import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, CATEGORIES, TYPES, fmt } from '../api.js';

const toLocal = (d) => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
const blank = { title: '', description: '', category: 'Education', contentType: 'video', thumbnailUrl: '', mediaUrl: '', articleBody: '', status: 'Draft', publishDate: '', featured: false };

function Overview({ call }) {
  const [s, setS] = useState(null);
  useEffect(() => { call('/dashboard/stats').then(setS).catch(() => {}); }, []);
  if (!s) return <p className="msg">Loading...</p>;
  const boxes = [['Total content', s.total], ['Published', s.published], ['Drafts', s.drafts], ['Scheduled', s.scheduled], ['Comments', s.comments], ['Views', s.totalViews], ['Likes', s.totalLikes]];
  return (
    <>
      <div className="stats">{boxes.map(([l, v]) => <div className="stat" key={l}><b>{v}</b><small>{l}</small></div>)}</div>
      <h3>Most popular</h3>
      {s.popular.length === 0 && <p className="msg">No content yet.</p>}
      {s.popular.map((p) => <p key={p._id}>{p.title} <small>{p.views} views, {p.likesCount} likes</small></p>)}
    </>
  );
}

function Items({ call, onEdit }) {
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const load = () => call('/contents/manage/all').then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const del = async (c) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    try { await call(`/contents/${c._id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); }
  };
  return (
    <>
      <button className="btn on" onClick={() => onEdit({})}>+ Add content</button>
      {err && <p className="msg err">{err}</p>}
      <div className="scroll">
        <table>
          <thead><tr><th>Title</th><th>Category</th><th>Type</th><th>Status</th><th>Publish date</th><th></th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id}>
                <td>{c.title}</td><td>{c.category}</td><td>{c.contentType}</td>
                <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                <td>{fmt(c.publishDate)}</td>
                <td className="acts"><button className="btn" onClick={() => onEdit(c)}>Edit</button><button className="btn danger" onClick={() => del(c)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p className="msg">No content yet. Add your first item.</p>}
    </>
  );
}

function Form({ call, item, done }) {
  const [f, setF] = useState(item._id ? { ...blank, ...item, publishDate: toLocal(item.publishDate) } : blank);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const body = { ...f, publishDate: f.publishDate ? new Date(f.publishDate).toISOString() : '' };
    try { await call(item._id ? `/contents/${item._id}` : '/contents', { method: item._id ? 'PUT' : 'POST', body }); done(); } catch (er) { setErr(er.message); }
  };
  return (
    <form className="cform" onSubmit={submit}>
      <h3>{item._id ? 'Edit content' : 'Add content'}</h3>
      <input placeholder="Title" value={f.title} onChange={set('title')} required />
      <textarea placeholder="Description" value={f.description} onChange={set('description')} required />
      <select value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      <select value={f.contentType} onChange={set('contentType')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <input placeholder="Thumbnail image URL" value={f.thumbnailUrl} onChange={set('thumbnailUrl')} />
      <input placeholder="Media URL (video, podcast, image link)" value={f.mediaUrl} onChange={set('mediaUrl')} />
      <textarea placeholder="Article content (optional if you gave a media URL)" value={f.articleBody} onChange={set('articleBody')} />
      <select value={f.status} onChange={set('status')}><option>Draft</option><option>Published</option><option>Scheduled</option></select>
      <label>Publish date and time (required for Scheduled)<input type="datetime-local" value={f.publishDate} onChange={set('publishDate')} /></label>
      <label className="chk"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Feature on home page</label>
      {err && <p className="msg err">{err}</p>}
      <div className="acts"><button className="btn on">Save</button><button type="button" className="btn" onClick={done}>Cancel</button></div>
    </form>
  );
}

function Comments({ call }) {
  const [list, setList] = useState([]);
  const load = () => call('/comments').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  const setStatus = async (c, status) => { await call(`/comments/${c._id}/status`, { method: 'PATCH', body: { status } }); load(); };
  const del = async (c) => { if (window.confirm('Delete this comment?')) { await call(`/comments/${c._id}`, { method: 'DELETE' }); load(); } };
  return (
    <>
      {list.length === 0 && <p className="msg">No comments yet.</p>}
      {list.map((c) => (
        <div className="comment" key={c._id}>
          <b>{c.displayName}</b> <small>on {c.content ? c.content.title : 'deleted content'} · {fmt(c.createdAt)} · <span className={`badge ${c.status}`}>{c.status}</span></small>
          <p>{c.text}</p>
          <div className="acts">
            {c.status === 'hidden' ? <button className="btn" onClick={() => setStatus(c, 'approved')}>Approve</button> : <button className="btn" onClick={() => setStatus(c, 'hidden')}>Hide</button>}
            <button className="btn danger" onClick={() => del(c)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Profile({ call }) {
  const [p, setP] = useState({ name: '', bio: '', avatarUrl: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { api('/auth/profile').then((d) => setP({ name: d.name || '', bio: d.bio || '', avatarUrl: d.avatarUrl || '' })); }, []);
  const save = async (e) => {
    e.preventDefault();
    try { await call('/auth/profile', { method: 'PUT', body: p }); setMsg('Saved!'); } catch (er) { setMsg(er.message); }
  };
  return (
    <form className="cform" onSubmit={save}>
      <input placeholder="Your name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} required />
      <textarea placeholder="Introduction" value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} />
      <input placeholder="Profile picture URL" value={p.avatarUrl} onChange={(e) => setP({ ...p, avatarUrl: e.target.value })} />
      <button className="btn on">Save profile</button>
      {msg && <small>{msg}</small>}
    </form>
  );
}

export default function Dashboard() {
  const token = localStorage.getItem('token');
  const nav = useNavigate();
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(null);
  if (!token) return <Navigate to="/admin/login" replace />;
  const logout = () => { localStorage.removeItem('token'); nav('/admin/login'); };
  const call = (path, opts = {}) => api(path, { ...opts, token }).catch((e) => { if (/authentication|token/i.test(e.message)) logout(); throw e; });
  const tabs = [['overview', 'Overview'], ['content', 'Content'], ['comments', 'Comments'], ['profile', 'Profile']];
  return (
    <div className="dash">
      <div className="row"><h1>Creator Dashboard</h1><button className="btn" onClick={logout}>Log out</button></div>
      <nav className="tabs">{tabs.map(([k, l]) => <button key={k} className={`btn ${tab === k && !editing ? 'on' : ''}`} onClick={() => { setEditing(null); setTab(k); }}>{l}</button>)}</nav>
      {editing ? <Form call={call} item={editing} done={() => setEditing(null)} /> : (
        <>
          {tab === 'overview' && <Overview call={call} />}
          {tab === 'content' && <Items call={call} onEdit={setEditing} />}
          {tab === 'comments' && <Comments call={call} />}
          {tab === 'profile' && <Profile call={call} />}
        </>
      )}
    </div>
  );
}
