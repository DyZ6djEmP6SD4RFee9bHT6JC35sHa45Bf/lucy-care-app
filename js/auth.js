const Auth = (() => {
  const KEY = "lc.auth.v1";
  const SESSION = "lc.session.v1";
  const TTL_MS = 12 * 60 * 60 * 1000;

  function bytesToHex(arr) {
    return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function sha256Sync(text) {
    function rr(n, x) { return (x >>> n) | (x << (32 - n)); }
    const K = [
      1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2415065432,2702644555,
      3209637790,3984757162,1426400815,1925078388,2162078206,2614888103,3248222580,3835390401,
      4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,
      2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,
      773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,
      2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,
      506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,
      2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298
    ];
    const bytes = new TextEncoder().encode(text);
    const bitLen = bytes.length * 8;
    const withOne = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
    withOne.set(bytes);
    withOne[bytes.length] = 0x80;
    const dv = new DataView(withOne.buffer);
    dv.setUint32(withOne.length - 4, bitLen, false);
    let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762;
    let h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
    const w = new Uint32Array(64);
    for (let i = 0; i < withOne.length; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false);
      for (let t = 16; t < 64; t++) {
        const s0 = rr(7, w[t-15]) ^ rr(18, w[t-15]) ^ (w[t-15] >>> 3);
        const s1 = rr(17, w[t-2]) ^ rr(19, w[t-2]) ^ (w[t-2] >>> 10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const S1 = rr(6, e) ^ rr(11, e) ^ rr(25, e);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        const S0 = rr(2, a) ^ rr(13, a) ^ rr(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    const out = new Uint8Array(32);
    const o = new DataView(out.buffer);
    o.setUint32(0, h0); o.setUint32(4, h1); o.setUint32(8, h2); o.setUint32(12, h3);
    o.setUint32(16, h4); o.setUint32(20, h5); o.setUint32(24, h6); o.setUint32(28, h7);
    return bytesToHex(out);
  }

  async function sha256(text) {
    try {
      if (crypto.subtle && window.isSecureContext) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return bytesToHex(new Uint8Array(buf));
      }
    } catch (_) {}
    return sha256Sync(text);
  }

  function randomSalt() {
    const a = new Uint8Array(16);
    try { crypto.getRandomValues(a); }
    catch {
      for (let i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256);
    }
    return bytesToHex(a);
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
  return { hasPassword: () => !!load(), isUnlocked: sessionValid, setup, verify, lock, touch, sha256 };
})();
