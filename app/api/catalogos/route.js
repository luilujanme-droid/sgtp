import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leerSesion } from '@/lib/session';

// Devuelve solo las máquinas y fallas del área del usuario.
// El Administrador debe indicar el área con ?area_id=
export async function GET(req) {
  const s = await leerSesion();
  if (!s) return NextResponse.json({ error: 'Sesión vencida' }, { status: 401 });

  const q = new URL(req.url).searchParams.get('area_id');
  const areaId = s.rol === 'ADMINISTRADOR' ? Number(q) : s.area_id;
  if (!areaId) return NextResponse.json({ error: 'Indica el área con ?area_id=' }, { status: 400 });

  const { data: area } = await db.from('areas').select('id,nombre,proceso_id').eq('id', areaId).single();
  if (!area) return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 });

  const [m, f] = await Promise.all([
    db.from('maquinas').select('id,nombre').eq('area_id', areaId).eq('activa', true).order('nombre'),
    db.from('catalogo_fallas').select('id,tipo,numero,subtipo,tipo_tiempo')
      .eq('proceso_id', area.proceso_id).eq('activo', true)
      .or(`area_id.is.null,area_id.eq.${areaId}`).order('numero'),
  ]);
  return NextResponse.json({ area, usuario: s.nombre, maquinas: m.data, fallas: f.data });
}
