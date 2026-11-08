import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt, viewerId } from '../api.js';

const yt = (u = '') => { const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); return m ? `https://www.youtube.com/embed/${m[1]}` : null; };

export default function ContentDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api(`/contents/${id}`).then((d) => { setC(d); setLikes(d.likesCount); }).catch((e) => setErr(e.message));
    api(`/likes/${id}?viewerId=${viewerId()}`).then((d) => setLiked(d.liked)).catch(() => {});
    api(`/comments/${id}`).then(setComments).catch(() => {});
  }, [id]);

  const like = async () => {
    try { const d = await api('/likes', { method: 'POST', body: { contentId: id, viewerId: viewerId() } }); setLiked(d.liked); setLikes(d.likesCount); } catch (e) { setFormMsg(e.message); }
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: c.title, url }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const submit = async (e) => {
    e.preventDefault(); setFormMsg('');
    try {
      const nc = await api('/comments', { method: 'POST', body: { contentId: id, displayName: name, text } });
      setComments([nc, ...comments]); setText(''); setFormMsg('Comment posted!');
    } catch (er) { setFormMsg(er.message); }
  };

  if (err) return <p className="msg err">{err} <Link to="/">Back</Link></p>;
  if (!c) return <p className="msg">Loading...</p>;
  const embed = c.contentType === 'video' && yt(c.mediaUrl);

  return (
    <article className="detail">
      <Link to="/">&larr; Back</Link>
      <span className="tag">{c.category} · {c.contentType}</span>
      <h1>{c.title}</h1>
      <small>Published {fmt(c.publishDate)} · {c.views} views</small>
      <p className="lead">{c.description}</p>

      {embed && <div className="video"><iframe src={embed} title={c.title} allowFullScreen /></div>}
      {c.contentType === 'image' && c.mediaUrl && <img className="media" src={c.mediaUrl} alt={c.title} />}
      {c.articleBody && <div className="article">{c.articleBody.split('\n').map((p, i) => <p key={i}>{p}</p>)}</div>}
      {c.mediaUrl && !embed && c.contentType !== 'image' && <p><a className="btn" href={c.mediaUrl} target="_blank" rel="noreferrer">Open media</a></p>}

      <div className="actions">
        <button className={`btn ${liked ? 'on' : ''}`} onClick={like}>{liked ? 'Liked' : 'Like'} ({likes})</button>
        <button className="btn" onClick={share}>{copied ? 'Link copied!' : 'Share'}</button>
      </div>

      <h2>Comments ({comments.length})</h2>
      <form onSubmit={submit} className="cform">
        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        <textarea placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} maxLength={500} required />
        <button className="btn on">Post comment</button>
        {formMsg && <small>{formMsg}</small>}
      </form>
      {comments.map((m) => (
        <div className="comment" key={m._id}><b>{m.displayName}</b> <small>{fmt(m.createdAt)}</small><p>{m.text}</p></div>
      ))}
    </article>
  );
}
