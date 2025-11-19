// src/pages/api/links/[code].js
import pool from '../../../../src/lib/db';
import { isValidCode } from '../../../../src/lib/validate';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!isValidCode(code)) {
    return res.status(400).json({ error: 'Invalid code format' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT code, target_url, clicks, last_clicked, created_at FROM links WHERE code=$1', [code]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { rowCount } = await pool.query('DELETE FROM links WHERE code=$1', [code]);
      if (!rowCount) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
