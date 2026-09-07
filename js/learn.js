const Learn = (() => {
  function lastDays(checks, n) {
    return (checks || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, n);
  }
  function insight(data) {
    const checks = lastDays(data.checks, 7);
    const lines = [];
    if (checks.length < 2) {
      return { mode: "regras + histórico", n: checks.length, focus: "baseline", lines: ["Ainda poucas noites no caderno. A app só aprende depois de 3–7 check-ins." ] };
    }
    const pain = checks.map((c) => Number(c.pain) || 0);
    const energy = checks.map((c) => Number(c.energy) || 0);
    const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    const nada = checks.filter((c) => c.appetite === "nada" || c.appetite === "pouco").length;
    const vomit = checks.filter((c) => c.vomit).length;
    const tears = checks.filter((c) => c.newTear).length;
    const mimo = checks.filter((c) => c.mimo).length;
    const openW = (data.wounds || []).filter((w) => w.status === "aberta" || w.status === "a_cicatrizar").length;
    if (avg(pain) >= 3.5) lines.push("Dor média alta nesta semana de caderno. Não é diagnóstico.");
    else if (pain[0] >= 4) lines.push("Dor de hoje alta no teu 1–5.");
    else if (pain.length >= 3 && pain[0] > pain[2]) lines.push("A dor que marcaste subiu face a há uns dias.");
    if (avg(energy) <= 2) lines.push("Energia baixa no histórico recente.");
    if (nada >= 2) lines.push("Apetite fraco em mais do que um dia. 24 h sem comer → vet.");
    if (vomit >= 1) lines.push("Houve vómito/diarreia no caderno recente.");
    if (tears >= 1) lines.push("Rasgão novo no histórico. Se luta, PARAR.");
    if (openW) lines.push(openW + " ferida(s) ainda aberta(s) ou a cicatrizar.");
    if (mimo === 0) lines.push("Nenhum mimo marcado nesta série.");
    if (!lines.length) lines.push("Caderno calmo nesta janela. Continua o check-in.");
    let focus = "calmo";
    if (tears >= 1 || openW) focus = "pele";
    else if (avg(pain) >= 3.5 || (pain[0] || 0) >= 4) focus = "dor";
    else if (nada >= 2 || vomit >= 1) focus = "apetite";
    return { mode: "regras + histórico (não é rede neural)", n: checks.length, focus, lines };
  }
  return { insight };
})();
