import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, CATEGORIES, fmt } from '../api.js';

export function Card({ c }) {
  return (
    <Link to={`/content/${c._id}`} className="card">
      {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" loading="lazy" /> : <div className="ph">{c.contentType}</div>}
      <div className="card-body">
        <span className="tag">{c.category}</span>
        <h3>{c.title}</h3>
        <p>{c.description}</p>
        <small>{fmt(c.publishDate)} · {c.views} views · {c.likesCount} likes</small>
      </div>
    </Link>
  );
}

export default function Home() {
  const [profile, setProfile] = useState({});
  const [featured, setFeatured] = useState([]);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [state, setState] = useState('loading');

  useEffect(() => {
    api('/auth/profile').then(setProfile).catch(() => {});
    api('/contents?featured=true').then(setFeatured).catch(() => {});
  }, []);

  useEffect(() => {
    setState('loading');
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (q.trim()) p.set('q', q.trim());
      if (category) p.set('category', category);
      api(`/contents?${p}`).then((d) => { setItems(d); setState('ok'); }).catch(() => setState('error'));
    }, 300);
    return () => clearTimeout(t);
  }, [q, category]);

  return (
    <>
      <section className="hero">
        {profile.avatarUrl ? <img className="avatar" src={profile.avatarUrl} alt="" /> : <div className="avatar ph">{(profile.name || 'C')[0]}</div>}
        <div>
          <h1>{profile.name || 'Content Creator'}</h1>
          <p>{profile.bio || 'Welcome! Browse my latest content below.'}</p>
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <h2>Featured</h2>
          <div className="grid">{featured.map((c) => <Card key={c._id} c={c} />)}</div>
        </section>
      )}

      <section>
        <h2>All content</h2>
        <div className="filters">
          <input type="search" placeholder="Search by title or keyword..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {state === 'loading' && <p className="msg">Loading...</p>}
        {state === 'error' && <p className="msg err">Could not load content. Is the server running?</p>}
        {state === 'ok' && items.length === 0 && <p className="msg">No content found.</p>}
        <div className="grid">{items.map((c) => <Card key={c._id} c={c} />)}</div>
      </section>
    </>
  );
}
