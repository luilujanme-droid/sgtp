'use client';
import { useEffect, useMemo, useState } from 'react';

export default function Registro() {
  const [cat, setCat] = useState(null);
  const [turno, setTurno] = useState(null);
  const [maquina, setMaquina] = useState('');
  const [tipo, setTipo] = useState('');
  const [falla, setFalla] = useState('');
  const [minutos, setMinutos] = useState('');
  const [obs, setObs] = useState('');
  const [msg, setMsg] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch('/api/catalogos' + window.location.search).then(async (r) => {
      if (r.status === 401) { window.location.href = '/login'; return; }
      const d = await r.json();
      if (!r.ok) { setMsg({ error: d.error }); return; }
      setCat(d);
    });
  }, []);

  const tipos = useMemo(() => [...new Set((cat?.fallas ?? []).map((f) => f.tipo))], [cat]);
  const subtipos = useMemo(() => (cat?.fallas ?? []).filter((f) => f.tipo === tipo), [cat, tipo]);

  async function enviar(e) {
    e.preventDefault();
    if (!turno) { setMsg({ error: 'Elige el turno' }); return; }
    setEnviando(true); setMsg(null);
    const area_id = new URLSearchParams(window.location.search).get('area_id');
    const r = await fetch('/api/eventos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turno, maquina_id: Number(maquina), falla_id: Number(falla), minutos: Number(minutos), observacion: obs, area_id }),
    });
    const d = await r.json();
    setEnviando(false);
    if (!r.ok) { setMsg({ error: d.error }); return; }
    setMsg({ ok: 'Registro guardado' });
    setFalla(''); setMinutos(''); setObs('');   // se conservan turno, máquina y tipo para el siguiente registro
  }

  if (!cat) return <main>{msg?.error ? <p className="error">{msg.error}</p> : <p className="sub">Cargando…</p>}</main>;

  return (
    <main>
      <h1>Registrar tiempo</h1>
      <p className="sub">{cat.area.nombre} · {cat.usuario}</p>
      <form onSubmit={enviar}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Turno</div>
          <div className="fila">
            {[1, 2, 3].map((n) => (
              <button type="button" key={n} className={'sec' + (turno === n ? ' on' : '')} onClick={() => setTurno(n)}>
                Turno {n}
              </button>
            ))}
          </div>
        </div>
        <label>Máquina
          <select required value={maquina} onChange={(e) => setMaquina(e.target.value)}>
            <option value="">Elige una máquina</option>
            {cat.maquinas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
        <label>Tipo de falla
          <select required value={tipo} onChange={(e) => { setTipo(e.target.value); setFalla(''); }}>
            <option value="">Elige el tipo</option>
            {tipos.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Subtipo
          <select required value={falla} onChange={(e) => setFalla(e.target.value)} disabled={!tipo}>
            <option value="">Elige el subtipo</option>
            {subtipos.map((f) => <option key={f.id} value={f.id}>{f.numero} · {f.subtipo}</option>)}
          </select>
        </label>
        <div>
          <label>Minutos
            <input type="number" inputMode="numeric" min={1} max={1440} required value={minutos}
              onChange={(e) => setMinutos(e.target.value)} />
          </label>
          <div className="fila" style={{ marginTop: 8 }}>
            {[5, 10, 30].map((n) => (
              <button type="button" key={n} className="sec" onClick={() => setMinutos(String((Number(minutos) || 0) + n))}>+{n}</button>
            ))}
          </div>
        </div>
        <label>Observación (opcional)
          <textarea maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} />
        </label>
        {msg?.error && <p className="error" role="alert">{msg.error}</p>}
        {msg?.ok && <p className="exito" role="status">{msg.ok}</p>}
        <button disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar registro'}</button>
      </form>
    </main>
  );
}
