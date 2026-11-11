import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function crearSesion(u) {
  const token = await new SignJWT({ id: u.id, rol: u.rol, area_id: u.area_id, nombre: u.nombres_apellidos })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10h')
    .sign(key());
  cookies().set('sgtp', token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 36000,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function leerSesion() {
  const t = cookies().get('sgtp')?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload; } catch { return null; }
}
