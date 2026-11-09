import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowDown, ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Film,
  Image as ImageIcon, Instagram, LockKeyhole, LogOut, Menu, Search,
  ShieldCheck, Sparkles, UploadCloud, X, Play, CalendarDays
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const demoMemories = [
  { id: 'demo-1', title: 'The days we will never forget', description: 'Every ordinary day became a story worth keeping.', event_name: 'Class moments', memory_date: '2026-06-12', media_type: 'image', media_url: '', demo: true },
  { id: 'demo-2', title: 'Together, one more time', description: 'The people who made the journey unforgettable.', event_name: 'Friendship', memory_date: '2026-05-20', media_type: 'image', media_url: '', demo: true },
  { id: 'demo-3', title: 'A little chaos, a lot of laughter', description: 'The moments between the lessons mattered too.', event_name: 'Behind the scenes', memory_date: '2026-04-08', media_type: 'video', media_url: '', demo: true },
];

const configured = Boolean(supabase);
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'A timeless memory';

function App() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [adminOpen, setAdminOpen] = useState(() => window.location.pathname.startsWith('/admin'));
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);

  async function loadMemories() {
    if (!supabase) { setMemories(demoMemories); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('memories')
      .select('*').eq('published', true).order('memory_date', { ascending: false });
    if (error) setNotice('Could not load memories. Check your Supabase setup.');
    else {
      const rows = (data || []).map(row => ({
        ...row,
        media_url: row.media_path ? supabase.storage.from('memory-media').getPublicUrl(row.media_path).data.publicUrl : ''
      }));
      setMemories(rows);
    }
    setLoading(false);
  }

  async function checkAdmin(user) {
    if (!supabase || !user) { setIsAdmin(false); return; }
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    setIsAdmin(Boolean(data));
  }

  useEffect(() => {
    const syncAdminRoute = () => setAdminOpen(window.location.pathname.startsWith('/admin'));
    window.addEventListener('popstate', syncAdminRoute);
    return () => window.removeEventListener('popstate', syncAdminRoute);
  }, []);

  function openAdmin() {
    if (window.location.pathname !== '/admin') window.history.pushState({}, '', '/admin');
    setAdminOpen(true);
  }

  function closeAdmin() {
    if (window.location.pathname.startsWith('/admin')) window.history.pushState({}, '', '/');
    setAdminOpen(false);
  }

  useEffect(() => {
    loadMemories();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      checkAdmin(data.session?.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      checkAdmin(next?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const filtered = useMemo(() => memories.filter(item => {
    const text = `${item.title} ${item.description || ''} ${item.event_name || ''}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === 'all' || item.media_type === filter);
  }), [memories, query, filter]);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setNotice(error.message);
    else setNotice('Signed in. Welcome to your admin space.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setNotice('You have been signed out.');
  }

  async function addMemory(form) {
    if (!supabase || !isAdmin) return;
    setUploading(true);
    const file = form.file;
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('memory-media').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type
    });
    if (uploadError) { setNotice(uploadError.message); setUploading(false); return; }
    const { error } = await supabase.from('memories').insert({
      title: form.title, description: form.description, event_name: form.event_name || null,
      memory_date: form.memory_date || null, media_type: file.type.startsWith('video/') ? 'video' : 'image',
      media_path: path, published: true, created_by: session.user.id
    });
    if (error) {
      await supabase.storage.from('memory-media').remove([path]);
      setNotice(error.message);
    } else {
      setNotice('Memory published successfully.');
      await loadMemories();
    }
    setUploading(false);
  }

  async function deleteMemory(item) {
    if (!supabase || !isAdmin || !confirm(`Delete "${item.title}" permanently?`)) return;
    const { error } = await supabase.from('memories').delete().eq('id', item.id);
    if (error) { setNotice(error.message); return; }
    if (item.media_path) await supabase.storage.from('memory-media').remove([item.media_path]);
    setSelected(null);
    setNotice('Memory deleted.');
    loadMemories();
  }

  const scrollToGallery = () => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });

  return <div className="site-shell">
    <div className="topline"><span>AN ARCHIVE OF OUR UPPERSIXTH JOURNEY</span><span className="topline-right"><span className="live-dot"/> MADE TO BE REMEMBERED</span></div>
    <header className="header">
      <a className="brand" href="#" aria-label="Uppersixth Memories home"><span className="brand-mark">U<span>.</span></span><span className="brand-name">UPPERSIXTH <small>MEMORIES</small></span></a>
      <nav className={mobileMenu ? 'nav nav-open' : 'nav'}>
        <a href="#home" onClick={() => setMobileMenu(false)}>Home</a>
        <a href="#gallery" onClick={() => setMobileMenu(false)}>Gallery</a>
        <a href="#about" onClick={() => setMobileMenu(false)}>Our story</a>
      </nav>
      <div className="header-actions">
        <button className="admin-link" onClick={openAdmin}><LockKeyhole size={15}/> Admin</button>
        <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X/> : <Menu/>}</button>
      </div>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-grain"/>
        <div className="hero-copy">
          <div className="eyebrow"><span/> THE CLASS ARCHIVE · EST. 2026</div>
          <h1>Some moments<br/>become <em>forever.</em></h1>
          <p className="hero-sub">A collection of the faces, places, laughter and little moments that made our uppersixth journey ours.</p>
          <div className="hero-buttons">
            <button className="button button-gold" onClick={scrollToGallery}>Explore memories <ArrowRight size={16}/></button>
            <a className="text-link" href="#about">Our story <ArrowDown size={14}/></a>
          </div>
        </div>
        <div className="hero-side-note"><span className="side-line"/>A TIME CAPSULE<br/>OF US</div>
        <div className="hero-bottom"><span>SCROLL TO REMEMBER</span><span>01 / THE BEGINNING</span></div>
      </section>

      <section className="intro section-wrap" id="about">
        <div className="section-kicker">01 — THE STORY</div>
        <div className="intro-grid">
          <h2>Not just pictures.<br/><em>A piece of who we were.</em></h2>
          <div className="intro-text"><p>There were lessons, friendships, unexpected adventures and moments we didn't know would mean so much. This space keeps them close.</p><p>Whenever we return, may every photograph bring back a story — and every story remind us that we were part of something special.</p><span className="signature">Our moments. Our stories. Our legacy.</span></div>
        </div>
      </section>

      <section className="gallery-section section-wrap" id="gallery">
        <div className="gallery-heading">
          <div><div className="section-kicker">02 — THE COLLECTION</div><h2>Memory <em>lane.</em></h2></div>
          <span className="memory-count">{memories.length.toString().padStart(2, '0')} MEMORIES</span>
        </div>
        <div className="gallery-tools">
          <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search moments, events..." aria-label="Search memories"/></div>
          <div className="filters">
            {[['all','All memories'],['image','Photos'],['video','Videos']].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={filter === key ? 'filter active' : 'filter'}>{label}</button>)}
          </div>
        </div>
        {loading ? <div className="empty-state"><div className="loader"/>Loading the memories...</div> :
          filtered.length ? <div className="memory-grid">{filtered.map((item, index) => <article className={`memory-card card-${index % 3}`} key={item.id}>
            <button className="memory-image" onClick={() => setSelected(item)} aria-label={`Open ${item.title}`}>
              {item.media_url ? (item.media_type === 'video' ? <video src={item.media_url} muted preload="metadata"/> : <img src={item.media_url} alt={item.title} loading="lazy"/>) :
                <div className={`placeholder-art art-${index % 3}`}><span className="placeholder-number">{String(index + 1).padStart(2,'0')}</span><span className="placeholder-caption">A MOMENT<br/>TO KEEP</span><Sparkles size={26}/></div>}
              <span className="media-indicator">{item.media_type === 'video' ? <Play size={13} fill="currentColor"/> : <Camera size={13}/>} {item.media_type === 'video' ? 'VIDEO' : 'PHOTO'}</span>
              <span className="image-open"><ArrowUpRightIcon/></span>
            </button>
            <div className="memory-meta"><span>{item.event_name || 'CLASS MEMORIES'}</span><span>{dateLabel(item.memory_date)}</span></div>
            <h3>{item.title}</h3><p>{item.description || 'A moment worth remembering.'}</p>
          </article>)}</div> : <div className="empty-state"><ImageIcon size={28}/><h3>No memories found</h3><p>Try another search or category.</p></div>}
      </section>

      <section className="quote-section"><div className="quote-mark">“</div><blockquote>We didn't realise we were making memories.<br/><em>We just knew we were having fun.</em></blockquote><span>— THE UPPERSIXTH YEARS</span></section>

      <section className="closing section-wrap"><div className="closing-content"><div className="section-kicker">03 — ALWAYS A PART OF US</div><h2>Different paths.<br/><em>One shared chapter.</em></h2><p>Wherever life takes us, these memories will always bring us back.</p><button className="button button-outline" onClick={scrollToGallery}>Revisit the gallery <ArrowRight size={16}/></button></div><div className="closing-stamp">U<span>.</span><small>MEMORIES<br/>ARCHIVE</small></div></section>
    </main>

    <footer className="footer"><a className="brand" href="#"><span className="brand-mark">U<span>.</span></span><span className="brand-name">UPPERSIXTH <small>MEMORIES</small></span></a><span>MADE OF MOMENTS. KEPT FOREVER.</span><span>© {new Date().getFullYear()} · OUR CLASS ARCHIVE</span></footer>

    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="memory-modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X/></button>
      {selected.media_url ? (selected.media_type === 'video' ? <video className="modal-media" src={selected.media_url} controls autoPlay/> : <img className="modal-media" src={selected.media_url} alt={selected.title}/>) : <div className="modal-placeholder"><Sparkles size={32}/></div>}
      <div className="modal-copy"><span className="section-kicker">{selected.event_name || 'CLASS MEMORIES'} · {dateLabel(selected.memory_date)}</span><h2>{selected.title}</h2><p>{selected.description}</p>{isAdmin && <button className="delete-button" onClick={() => deleteMemory(selected)}>Delete memory</button>}</div>
    </div></div>}

    {adminOpen && <AdminModal configured={configured} session={session} isAdmin={isAdmin} onClose={closeAdmin} onSignIn={signIn} onSignOut={signOut} onAdd={addMemory} uploading={uploading}/>}
  </div>;
}

function ArrowUpRightIcon() { return <ArrowRight size={18}/>; }

function AdminModal({ configured, session, isAdmin, onClose, onSignIn, onSignOut, onAdd, uploading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({ title: '', description: '', event_name: '', memory_date: '', file: null });
  const [localError, setLocalError] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (!form.file) { setLocalError('Choose a photo or video first.'); return; }
    if (form.file.size > 100 * 1024 * 1024) { setLocalError('File is too large. Maximum size is 100 MB.'); return; }
    await onAdd(form);
    setForm({ title: '', description: '', event_name: '', memory_date: '', file: null });
    e.target.reset();
  };
  return <div className="modal-backdrop admin-backdrop" onClick={onClose}><div className="admin-panel" onClick={e => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X/></button>
    <div className="section-kicker">PRIVATE ACCESS</div><h2>Admin <em>studio.</em></h2><p className="admin-intro">Manage the memories that appear in the public archive.</p>
    {!configured ? <div className="setup-warning"><ShieldCheck/><h3>Connect your Supabase project</h3><p>Add your Supabase URL and anon key to the environment file, then restart the site. Follow the included README.</p></div> :
      !session ? <form className="admin-form" onSubmit={e => { e.preventDefault(); onSignIn(email, password); }}>
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"/></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your admin password"/></label>
        <button className="button button-gold full" type="submit"><LockKeyhole size={16}/> Sign in</button>
        <p className="form-hint">Admin accounts are created in Supabase. Public visitors cannot create accounts here.</p>
      </form> : !isAdmin ? <div className="setup-warning"><LockKeyhole/><h3>Account is not an administrator</h3><p>This account has signed in, but it has not been added to the admin allowlist in Supabase.</p><button className="button button-outline full" onClick={onSignOut}>Sign out</button></div> :
      <><div className="admin-status"><span className="live-dot"/> ADMIN ACCESS VERIFIED <button onClick={onSignOut}><LogOut size={14}/> Sign out</button></div>
        <form className="admin-form" onSubmit={submit}>
          <label>Memory title<input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Last day together"/></label>
          <label>Short description<textarea rows="3" value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Tell the story behind this memory..."/></label>
          <div className="form-row"><label>Event / category<input value={form.event_name} onChange={e => setForm({...form,event_name:e.target.value})} placeholder="Class trip, sports day..."/></label><label>Date<input type="date" value={form.memory_date} onChange={e => setForm({...form,memory_date:e.target.value})}/></label></div>
          <label className="file-picker"><UploadCloud size={21}/><strong>{form.file ? form.file.name : 'Choose a photo or video'}</strong><span>JPG, PNG, WEBP, MP4 or MOV · Up to 100 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={e => setForm({...form,file:e.target.files?.[0] || null})}/></label>
          {localError && <p className="inline-error">{localError}</p>}
          <button className="button button-gold full" type="submit" disabled={uploading}>{uploading ? 'Publishing...' : <><UploadCloud size={16}/> Publish memory</>}</button>
        </form>
      </>}
  </div></div>;
}

export default App;
