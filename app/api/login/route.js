import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { crearSesion } from '@/lib/session';

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;

export async function POST(req) {
  const { dni, pin } = await req.json();
  const malo = () => NextResponse.json({ error: 'DNI o PIN incorrecto' }, { status: 401 });

  if (!/^\d{8}$/.test(dni ?? '') || !/^\d{6,}$/.test(pin ?? '')) return malo();

  const { data: u } = await db.from('usuarios').select('*').eq('dni', dni).maybeSingle();
  if (!u || !u.activo) return malo();

  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
    return NextResponse.json(
      { error: `Usuario bloqueado. Intenta de nuevo en ${BLOQUEO_MIN} minutos.` }, { status: 423 });
  }

  if (!(await bcrypt.compare(pin, u.pin_hash))) {
    const n = u.intentos_fallidos + 1;
    await db.from('usuarios').update(
      n >= MAX_INTENTOS
        ? { intentos_fallidos: 0, bloqueado_hasta: new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString() }
        : { intentos_fallidos: n }
    ).eq('id', u.id);
    return malo();
  }

  await db.from('usuarios').update({ intentos_fallidos: 0, bloqueado_hasta: null }).eq('id', u.id);
  await crearSesion(u);
  return NextResponse.json({ ok: true });
}
