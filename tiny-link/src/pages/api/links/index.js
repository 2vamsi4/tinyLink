// src/pages/api/links/index.js
import pool from '../../../../src/lib/db';
import { isValidCode, isValidUrl } from '../../../../src/lib/validate';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { target_url, code } = req.body ?? {};

    if (!target_url || !isValidUrl(target_url)) {
      return res.status(400).json({ error: 'Invalid target_url' });
    }

    let finalCode = code ? String(code) : null;
    if (finalCode) {
      if (!isValidCode(finalCode)) {
        return res.status(400).json({ error: 'Invalid code format. Use [A-Za-z0-9]{6,8}.' });
      }
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const gen = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      let attempts = 0;
      do {
        finalCode = gen();
        const { rows } = await pool.query('SELECT 1 FROM links WHERE code=$1', [finalCode]);
        if (!rows.length) break;
        attempts++;
      } while (attempts < 10);
      if (attempts >= 10) return res.status(500).json({ error: 'Could not generate unique code, try again' });
    }

    try {
      await pool.query('INSERT INTO links(code, target_url) VALUES($1, $2)', [finalCode, target_url]);
      return res.status(201).json({ code: finalCode, target_url });
    } catch (err) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        return res.status(409).json({ error: 'Code already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT code, target_url, clicks, last_clicked, created_at FROM links ORDER BY created_at DESC');
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
