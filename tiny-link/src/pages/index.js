// src/pages/index.js
import { useState, useEffect, useMemo } from 'react';

/* -----------------------------
   Helper + Header + Footer
------------------------------*/

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <h1 style={styles.logo}>TinyLink</h1>
        <p style={styles.headerSubtitle}>
          Shorten links, track clicks, and manage your URLs.
        </p>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        Built with ❤️ • Ensure you run the DB migration before use.
      </div>
    </footer>
  );
}

function isValidUrl(str) {
  if (typeof str !== 'string') return false;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/* -----------------------------
   MAIN COMPONENT
------------------------------*/

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({ target_url: '', code: '' });
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/links');
      if (!res.ok) {
        setError('Failed to load links');
        setLoading(false);
        return;
      }
      const json = await res.json();
      setLinks(json);
    } catch {
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  }

  function clearMessages(delay = 3000) {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, delay);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { target_url, code } = form;

    if (!target_url) {
      setError('Please enter the target URL.');
      clearMessages();
      return;
    }
    if (!isValidUrl(target_url)) {
      setError('URL must start with http:// or https://');
      clearMessages();
      return;
    }
    if (code && !CODE_REGEX.test(code)) {
      setError('Custom code must be 6–8 characters (A–Z, a–z, 0–9).');
      clearMessages();
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url, code: code || undefined }),
      });

      const body = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setError(body?.error || 'Custom code already exists.');
        setCreating(false);
        clearMessages();
        return;
      }

      if (!res.ok) {
        setError(body?.error || 'Create failed.');
        setCreating(false);
        clearMessages();
        return;
      }

      setSuccess('Link created successfully.');
      setForm({ target_url: '', code: '' });
      await fetchList();
      clearMessages();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(code) {
    if (!confirm(`Delete ${code}?`)) return;
    try {
      const res = await fetch(`/api/links/${code}`, { method: 'DELETE' });
      if (!res.ok) return alert('Delete failed');
      setLinks(prev => prev.filter(l => l.code !== code));
      setSuccess('Link deleted.');
      clearMessages();
    } catch {
      alert('Delete failed');
    }
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir(s => (s === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  }

  function copyShortUrl(code) {
    const base = window.location.origin;
    navigator.clipboard.writeText(`${base}/${code}`).then(
      () => setSuccess('Copied!'),
      () => setError('Copy failed')
    );
    clearMessages(1500);
  }

  const filtered = useMemo(() => {
    const qLower = q.toLowerCase();
    const out = links.filter(l =>
      l.code.toLowerCase().includes(qLower) ||
      l.target_url.toLowerCase().includes(qLower)
    );

    const dir = sortDir === 'desc' ? -1 : 1;
    out.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === 'created_at' || sortBy === 'last_clicked') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (va === vb) return 0;
      return va > vb ? -1 * dir : 1 * dir;
    });

    return out;
  }, [links, q, sortBy, sortDir]);

  return (
    <div style={styles.page}>
      {/* Inject CSS */}
      <style>{css}</style>

      <Header />

      <main style={styles.container}>
        {/* CREATE FORM */}
        <section style={{ marginBottom: 24 }}>
          <form style={styles.formRow} onSubmit={handleCreate}>
            <input
              style={styles.input}
              placeholder="https://example.com"
              value={form.target_url}
              onChange={e => setForm({ ...form, target_url: e.target.value })}
            />

            <input
              style={{ ...styles.input, maxWidth: 160 }}
              placeholder="Custom code"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
            />

            <button style={creating ? styles.btnDisabled : styles.btn} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
        </section>

        {/* SEARCH + SORT */}
        <section style={styles.controls}>
          <input
            style={styles.search}
            placeholder="Search by code or URL"
            value={q}
            onChange={e => setQ(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.sortBtn} onClick={() => toggleSort('created_at')}>
              Created {sortBy === 'created_at' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button style={styles.sortBtn} onClick={() => toggleSort('clicks')}>
              Clicks {sortBy === 'clicks' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button style={styles.sortBtn} onClick={() => toggleSort('code')}>
              Code {sortBy === 'code' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
        </section>

        {/* TABLE */}
        <section>
          {loading ? (
            <div style={styles.loading}>Loading links…</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Target URL</th>
                    <th style={styles.th}>Clicks</th>
                    <th style={styles.th}>Last Clicked</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={styles.empty}>No links found.</td>
                    </tr>
                  ) : (
                    filtered.map((l, i) => (
                      <tr key={l.code} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td style={styles.td}>{l.code}</td>
                        <td style={styles.td}>
                          <div style={styles.truncate}>{l.target_url}</div>
                        </td>
                        <td style={styles.tdCenter}>{l.clicks ?? 0}</td>
                        <td style={styles.td}>
                          {l.last_clicked ? new Date(l.last_clicked).toLocaleString() : '-'}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a href={`/code/${l.code}`} style={styles.link}>Stats</a>
                            <a
                              href={`${window.location.origin}/${l.code}`}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.link}
                            >
                              Open
                            </a>
                            <button style={styles.copyBtn} onClick={() => copyShortUrl(l.code)}>
                              Copy
                            </button>
                            <button style={styles.delBtn} onClick={() => handleDelete(l.code)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* -----------------------------
   CSS (string)
------------------------------*/

const css = `
  a:hover {
    opacity: 0.7;
  }
`;

/* -----------------------------
   INLINE STYLE OBJECTS
------------------------------*/

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#1e293b',
    fontFamily: 'Inter, sans-serif',
  },
  header: { background: '#fff', borderBottom: '1px solid #e2e8f0' },
  headerInner: { maxWidth: 900, margin: '0 auto', padding: '20px' },
  logo: { fontSize: 26, fontWeight: 600, color: '#2563eb' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  container: { maxWidth: 900, margin: '0 auto', padding: 20 },
  formRow: { display: 'flex', gap: 12 },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    fontSize: 14,
  },

  btn: {
    padding: '10px 18px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
  },
  btnDisabled: {
    padding: '10px 18px',
    background: '#94a3b8',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
  },

  error: { color: '#dc2626', marginTop: 10, fontSize: 14 },
  success: { color: '#16a34a', marginTop: 10, fontSize: 14 },

  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  search: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    flex: 1,
  },

  sortBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    fontSize: 13,
    cursor: 'pointer',
    background: '#fff',
  },

  loading: {
    padding: 20,
    background: '#eef2ff',
    borderRadius: 6,
  },

  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    background: '#fff',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },

  th: {
    textAlign: 'left',
    padding: 12,
    background: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 600,
    color: '#475569',
  },

  td: { padding: '12px 10px', verticalAlign: 'top' },
  tdCenter: { padding: 12, textAlign: 'center' },

  empty: { padding: 20, textAlign: 'center', color: '#64748b' },

  rowEven: { background: '#ffffff' },
  rowOdd: { background: '#f8fafc' },

  truncate: {
    maxWidth: 520,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  link: { color: '#2563eb', textDecoration: 'underline', fontSize: 13 },

  copyBtn: {
    padding: '4px 8px',
    border: '1px solid #94a3b8',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },

  delBtn: {
    color: '#dc2626',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 13,
  },

  footer: {
    marginTop: 40,
    borderTop: '1px solid #e2e8f0',
    background: '#fff',
    padding: 20,
  },
  footerInner: { maxWidth: 900, margin: '0 auto', fontSize: 14, color: '#64748b' },
};

