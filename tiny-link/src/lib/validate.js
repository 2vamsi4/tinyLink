// src/lib/validate.js
export function isValidCode(code) {
  return typeof code === 'string' && /^[A-Za-z0-9]{6,8}$/.test(code);
}

export function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}
