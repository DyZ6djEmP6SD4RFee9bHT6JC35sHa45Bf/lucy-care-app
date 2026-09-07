const Sync = (() => {
  const URL = "https://wzxvfkehrunzbvzulhqs.supabase.co/rest/v1/lucy_home";
  const SB = "https://wzxvfkehrunzbvzulhqs.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eHZma2VocnVuemJ2enVsaHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDMzMTQsImV4cCI6MjEwNDM3OTMxNH0.Rq8n90-bh88uM_OL9FPYo-DwvCYo2_ULA-OwLJJwgL0";
  const HK = "lc.house.v1";
  const house = () => (localStorage.getItem(HK) || "lucy-casa").trim() || "lucy-casa";
  const setHouse = (h) => localStorage.setItem(HK, (h || "lucy-casa").trim());
  async function rowId() { return Auth.sha256("lucy-home:" + house()); }
  async function headers() {
    const id = await rowId();
    return { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", "x-house-id": id };
  }
  function merge(local, remote) {
    const out = { ...remote, ...local, profile: { ...(remote.profile || {}), ...(local.profile || {}) } };
    const cmap = {};
    (remote.checks || []).concat(local.checks || []).forEach((c) => { if (c && c.date) cmap[c.date] = { ...(cmap[c.date] || {}), ...c }; });
    out.checks = Object.values(cmap);
    const wmap = {};
    (remote.wounds || []).concat(local.wounds || []).forEach((w) => { if (w && w.id) wmap[w.id] = { ...(wmap[w.id] || {}), ...w }; });
    out.wounds = Object.values(wmap);
    const dmap = {};
    (remote.docs || []).concat(local.docs || []).forEach((d) => { if (d && d.id) dmap[d.id] = { ...(dmap[d.id] || {}), ...d }; });
    out.docs = Object.values(dmap);
    return out;
  }
  async function pull() {
    const id = await rowId();
    const res = await fetch(URL + "?id=eq." + id + "&select=payload", { headers: await headers() });
    const rows = await res.json();
    return rows[0] || null;
  }
  async function push(data) {
    const id = await rowId();
    const h = await headers();
    const body = { id, payload: data, updated_at: new Date().toISOString() };
    const res = await fetch(URL, { method: "POST", headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(body) });
    if (!res.ok) await fetch(URL + "?id=eq." + id, { method: "PATCH", headers: h, body: JSON.stringify({ payload: data, updated_at: body.updated_at }) });
  }
  async function sync() {
    const local = Store.load();
    const remote = await pull();
    const next = remote && remote.payload ? merge(local, remote.payload) : local;
    Store.save(next);
    await push(Store.load());
    return next;
  }
  function shrink(file) {
    return new Promise((resolve, reject) => {
      if (!file.type || !file.type.startsWith("image/")) {
        if (file.size > 8e6) return reject(new Error("PDF máx. 8 MB"));
        return resolve(file);
      }
      const img = new Image();
      const fr = new FileReader();
      fr.onload = () => {
        img.onload = () => {
          const m = 1280;
          let w = img.width, h = img.height;
          if (w > m || h > m) { const s = m / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          c.toBlob((b) => resolve(b || file), "image/jpeg", 0.72);
        };
        img.onerror = () => resolve(file);
        img.src = fr.result;
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }
  async function upload(file, note) {
    const id = await rowId();
    const safe = (file.name || "ficheiro").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
    const path = id + "/" + Date.now() + "-" + safe;
    const blob = await shrink(file);
    const res = await fetch(SB + "/storage/v1/object/lucy-docs/" + path, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": blob.type || "application/octet-stream" },
      body: blob
    });
    if (!res.ok) throw new Error("Falha no envio (" + res.status + ")");
    const url = SB + "/storage/v1/object/public/lucy-docs/" + path;
    Store.addDoc({ id: "d" + Date.now(), name: file.name, kind: blob.type, note: note || "", url, when: Store.today() });
    await sync();
    return url;
  }
  return { house, setHouse, sync, upload };
})();
