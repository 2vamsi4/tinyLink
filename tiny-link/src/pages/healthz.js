// src/pages/healthz.js
export async function getServerSideProps() {
  return { props: {} };
}
export default function Health() {
  return <pre>{JSON.stringify({ ok: true, version: '1.0' })}</pre>;
}
