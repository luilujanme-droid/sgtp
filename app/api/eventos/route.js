import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leerSesion } from '@/lib/session';

const err = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req) {
  const s = await leerSesion();
  if (!s) return err('Sesión vencida', 401);

  const b = await req.json();
  const areaId = s.rol === 'ADMINISTRADOR' ? Number(b.area_id) : s.area_id;
  const numero = Number(b.turno);
  const minutos = Number(b.minutos);
  const observacion = (b.observacion ?? '').trim().slice(0, 500) || null;

  if (!areaId) return err('Área no indicada');
  if (![1, 2, 3].includes(numero)) return err('Turno inválido');
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 1440) return err('Los minutos deben estar entre 1 y 1440');

  // La máquina y la falla deben pertenecer al área / proceso del usuario
  const { data: area } = await db.from('areas').select('proceso_id').eq('id', areaId).single();
  const [{ data: maq }, { data: falla }] = await Promise.all([
    db.from('maquinas').select('id').eq('id', b.maquina_id).eq('area_id', areaId).eq('activa', true).maybeSingle(),
    db.from('catalogo_fallas').select('id').eq('id', b.falla_id).eq('proceso_id', area?.proceso_id)
      .eq('activo', true).or(`area_id.is.null,area_id.eq.${areaId}`).maybeSingle(),
  ]);
  if (!maq) return err('Máquina no válida para tu área');
  if (!falla) return err('Falla no válida para tu proceso');

  // Turno del día (hora de Lima); se crea si no existe
  const fecha = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  await db.from('turnos').upsert({ fecha, numero, area_id: areaId },
    { onConflict: 'fecha,numero,area_id', ignoreDuplicates: true });
  const { data: turno } = await db.from('turnos').select('id,estado')
    .match({ fecha, numero, area_id: areaId }).single();
  if (turno.estado === 'CERRADO') return err('El turno está cerrado. Pide al Facilitador que lo reabra.', 409);

  const { data: ev, error } = await db.from('eventos').insert({
    turno_id: turno.id, maquina_id: maq.id, falla_id: falla.id,
    minutos, observacion, registrado_por: s.id,
  }).select().single();
  if (error) return err('No se pudo guardar el registro', 500);

  await db.from('auditoria').insert({
    usuario_id: s.id, entidad: 'evento', entidad_id: ev.id, accion: 'CREAR', valor_nuevo: ev,
  });
  return NextResponse.json({ ok: true, id: ev.id });
}
