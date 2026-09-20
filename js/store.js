const Store = (() => {
  const KEY = "lc.data.v1";
  const SHELF_URL = "https://raw.githubusercontent.com/DyZ6djEmP6SD4RFee9bHT6JC35sHa45Bf/lucy-care-shelf/main/data/estudos.json";
  const CENTRAL_REV = 5;
  const CENTRAL = {
    profile: {
      name: "Lucy",
      age: "~2 anos e 6 meses (nasc. 01/04/2024 João XXI). Scottish Fold, dobra só na ponta da orelha.",
      weightKg: "",
      diagnosis: "Astenia cutânea / EDS clínico (VetOlaias 17/12/2024, sem teste genético). Hérnia umbilical. Costela fracturada em cria, calo irregular, alto na barriga. História aos 6 meses: sarna à chegada → tinha → piodermite grave.",
      meds: "Gabapentina diária 25 mg (comp. 100 mg partidos em 4). 50 mg se agitada/dor; raro 75–100 — escala da médica. Doses restantes: o vet. Alta AniCura tutor 07/09/2026.",
      vet: "João XXI 218 489 230. AniCura 213 156 207 / 927 427 505.",
      allergies: "",
      likes: "Liô; colar-flor mole; caixa com penas. Pijama elástico macio (poliéster/elastano) corpo/pernas/pescoço. Cone acolchoado no pescoço e na borda. Não gosta de colo; usa avental canguru. Feridas camufladas em nós/cordões de pelo com crosta por baixo."
    },
    checks: [
      {
        date: "2026-09-07",
        mimo: true,
        note: "Ela hoje está bem. Não me parece que tenha dores, mas se tocar nas patas onde ainda estão as feridas ela reage mal. As feridas já estão cicatrizadas. A da pata dianteira esquerda está mais avançada, já não tem crosta. A ferida da pata traseira esquerda ainda tem uma grande crosta. Apareceu mais uma pequena ferida na pata traseira direita. Só reparei ontem.",
        pain: 2,
        water: true,
        energy: 4,
        appetite: "bem"
      },
      {
        date: "2026-09-08",
        mimo: true,
        note: "Ela hoje está bem. Não me parece que tenha dores, mas se wu lhe tocar nas patas onde ainda estão as feridas ela reage muito mal. As feridas já estão quase cicatrizadas. A da pata dianteira esquerda está mais avançada, já não tem crosta. A ferida da pata traseira esquerda ainda tem uma grande crosta e pequenas crostas em algumas partes. Apareceu mais uma pequena ferida na pata traseira direita. Só reparei ontem.",
        pain: 2,
        vomit: false,
        water: true,
        energy: 3,
        litter: "normal",
        newTear: false,
        appetite: "normal",
        tearSize: "",
        tearWhere: "",
        dressingOn: false,
        nailsTrimmed: false
      }
    ],
    wounds: [
      {
        id: "w1788814068417",
        where: "Pata traseira direita — pequena ferida nova",
        opened: "2026-09-07",
        status: "aberta"
      },
      {
        id: "w-dianteira-esq-2026-08-19",
        cause: "Brincadeira com o outro gato.",
        where: "Pata dianteira esquerda",
        opened: "2026-08-19",
        sizeCm: "4",
        status: "a_cicatrizar"
      },
      {
        id: "w-traseira-esq-2026-08-25",
        cause: "Contenção AniCura: 4 assistentes.",
        where: "Pata traseira esquerda",
        opened: "2026-08-25",
        sizeCm: "7",
        status: "aberta"
      }
    ]
  };
  function today() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
  }
  function empty() {
    return {
      profile: Object.assign({}, CENTRAL.profile),
      checks: CENTRAL.checks.slice(),
      wounds: CENTRAL.wounds.slice(),
      docs: [],
      research: [],
      seeded: true,
      seedRev: CENTRAL_REV
    };
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }
  function mergeCentral(data) {
    data.profile = Object.assign({}, data.profile || {}, CENTRAL.profile);
    const byDate = new Set((data.checks || []).map((c) => c.date));
    CENTRAL.checks.forEach((c) => {
      if (!byDate.has(c.date)) data.checks.push(c);
    });
    data.checks.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    data.wounds = data.wounds || [];
    const byId = new Set(data.wounds.map((w) => w.id));
    CENTRAL.wounds.forEach((w) => {
      if (!byId.has(w.id)) data.wounds.push(w);
    });
    data.wounds = data.wounds.filter((w) => w && w.id !== "w1788817532675");
    data.seeded = true;
    data.seedRev = CENTRAL_REV;
    data.centralAt = "2026-09-20";
    return data;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return save(empty());
      const parsed = JSON.parse(raw);
      let data = {
        profile: Object.assign({}, empty().profile, parsed.profile || {}),
        checks: Array.isArray(parsed.checks) ? parsed.checks : [],
        wounds: Array.isArray(parsed.wounds) ? parsed.wounds : [],
        docs: Array.isArray(parsed.docs) ? parsed.docs : [],
        research: Array.isArray(parsed.research) ? parsed.research : [],
        seeded: true,
        seedRev: parsed.seedRev || 0,
        centralAt: parsed.centralAt || ""
      };
      if ((data.seedRev || 0) < CENTRAL_REV) data = save(mergeCentral(data));
      return data;
    } catch {
      return save(empty());
    }
  }
  function mergeResearch(list) {
    const data = load();
    const have = new Set((data.research || []).map((x) => x.id));
    (list || []).forEach((p) => { if (p && p.id && !have.has(p.id)) data.research.push(p); });
    return save(data);
  }
  async function pullShelf() {
    const res = await fetch(SHELF_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Prateleira indisponivel.");
    const json = await res.json();
    if (!json || !Array.isArray(json.research)) throw new Error("Prateleira invalida.");
    mergeResearch(json.research);
    return json;
  }
  return {
    today, load, save, KEY, pullShelf, mergeResearch, CENTRAL_REV,
    upsertCheck(partial) {
      const data = load();
      const date = partial.date || today();
      const next = Object.assign({ date, appetite: "normal", water: true, energy: 3, pain: 1, litter: "normal", vomit: false, mimo: false, note: "", newTear: false, tearWhere: "", tearSize: "", dressingOn: false, nailsTrimmed: false }, partial);
      const i = data.checks.findIndex((c) => c.date === date);
      if (i >= 0) data.checks[i] = Object.assign({}, data.checks[i], next); else data.checks.unshift(next);
      return save(data);
    },
    checkFor: (d) => load().checks.find((c) => c.date === d) || null,
    addWound(w) { const data = load(); data.wounds.unshift(Object.assign({ id: "w" + Date.now(), opened: today(), where: "", status: "aberta", note: "" }, w)); return save(data); },
    setWoundStatus(id, status) { const data = load(); const w = data.wounds.find((x) => x.id === id); if (w) w.status = status; return save(data); },
    addDoc(doc) { const data = load(); data.docs = data.docs || []; data.docs.unshift(doc); return save(data); },
    saveProfile(p) { const data = load(); data.profile = Object.assign({}, data.profile, p); return save(data); },
    exportJson: () => JSON.stringify(load(), null, 2),
    importJson(text) {
      const parsed = JSON.parse(text);
      const cur = load();
      if (Array.isArray(parsed.research) && parsed.checks === undefined) return mergeResearch(parsed.research);
      return save(mergeCentral({
        profile: Object.assign({}, empty().profile, cur.profile, parsed.profile || {}),
        checks: parsed.checks || cur.checks || [],
        wounds: parsed.wounds || cur.wounds || [],
        docs: parsed.docs || cur.docs || [],
        research: parsed.research || cur.research || [],
        seeded: true,
        seedRev: 0
      }));
    },
    alerts(data) {
      const out = []; const last = data.checks[0];
      if (last && last.appetite === "nada") out.push("Nao comeu. Se passar das 24 h, liga ao vet.");
      if (last && last.vomit) out.push("Vomito ou diarreia hoje.");
      if (last && last.pain >= 4) out.push("Dor alta — fala com o vet.");
      return out;
    }
  };
})();
