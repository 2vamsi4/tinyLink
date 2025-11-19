// src/pages/code/[code].js
import { useRouter } from 'next/router';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Not found');
  return r.json();
});

export default function CodeStats() {
  const router = useRouter();
  const { code } = router.query;
  const { data, error } = useSWR(code ? `/api/links/${code}` : null, fetcher);

  if (!code) return <div>Loading…</div>;
  if (error) return <div>Code not found</div>;
  if (!data) return <div>Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl mb-4">Stats for {data.code}</h1>
      <dl>
        <dt className="font-semibold">Target URL</dt>
        <dd className="mb-2"><a href={data.target_url} target="_blank" rel="noreferrer" className="underline">{data.target_url}</a></dd>

        <dt className="font-semibold">Total Clicks</dt>
        <dd className="mb-2">{data.clicks}</dd>

        <dt className="font-semibold">Last Clicked</dt>
        <dd className="mb-2">{data.last_clicked ? new Date(data.last_clicked).toLocaleString() : '-'}</dd>

        <dt className="font-semibold">Created</dt>
        <dd className="mb-2">{new Date(data.created_at).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
