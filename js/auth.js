const Auth = (() => {
  const KEY = "lc.auth.v1";
  const SESSION = "lc.session.v1";
  const TTL_MS = 12 * 60 * 60 * 1000;
  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function randomSalt() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch { return null; }
  }
  function sessionValid() {
    const raw = sessionStorage.getItem(SESSION);
    if (!raw) return false;
    const t = Number(raw);
    return Number.isFinite(t) && Date.now() - t < TTL_MS;
  }
  function touch() { sessionStorage.setItem(SESSION, String(Date.now())); }
  function lock() { sessionStorage.removeItem(SESSION); }
  async function setup(password) {
    if (!password || password.length < 6) throw new Error("Mínimo 6 caracteres.");
    const salt = randomSalt();
    const hash = await sha256(salt + password);
    localStorage.setItem(KEY, JSON.stringify({ salt, hash, createdAt: new Date().toISOString() }));
    touch();
  }
  async function verify(password) {
    const rec = load();
    if (!rec) throw new Error("Ainda não há palavra-passe.");
    const hash = await sha256(rec.salt + password);
    if (hash !== rec.hash) throw new Error("Palavra-passe incorrecta.");
    touch();
  }
  return {
    hasPassword: () => !!load(),
    isUnlocked: sessionValid,
    setup,
    verify,
    lock,
    touch,
  };
})();
