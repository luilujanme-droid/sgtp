'use client';
import { useState } from 'react';

export default function Login() {
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dni, pin }),
    });
    if (r.ok) { window.location.href = '/registro'; return; }
    setError((await r.json()).error); setCargando(false);
  }

  return (
    <main>
      <h1>Ingresar al sistema</h1>
      <p className="sub">Usa tu DNI y tu PIN.</p>
      <form onSubmit={enviar}>
        <label>DNI
          <input inputMode="numeric" maxLength={8} pattern="\d{8}" required autoComplete="username"
            value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label>PIN (mínimo 6 dígitos)
          <input type="password" inputMode="numeric" minLength={6} pattern="\d{6,}" required autoComplete="current-password"
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  );
}
