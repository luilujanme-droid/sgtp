import './globals.css';

export const metadata = { title: 'SGTP · Tiempo perdido', description: 'Registro de tiempos perdidos en planta' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
