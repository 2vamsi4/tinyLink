// src/pages/[code].js
import pool from '../lib/db';
import { isValidCode } from '../lib/validate';

export async function getServerSideProps({ params, res }) {
  const { code } = params;

  if (!isValidCode(code)) {
    res.statusCode = 404;
    return { props: {} };
  }

  try {
    const { rows } = await pool.query('SELECT target_url FROM links WHERE code=$1', [code]);
    if (!rows.length) {
      res.statusCode = 404;
      return { props: {} };
    }
    const target = rows[0].target_url;

    // Update clicks and last_clicked
    await pool.query('UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code=$1', [code]);

    return {
      redirect: {
        destination: target,
        permanent: false,
      },
    };
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return { props: {} };
  }
}

export default function RedirectPage() {
  return <div>Redirecting…</div>;
}
