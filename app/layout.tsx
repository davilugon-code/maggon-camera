import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maggon - Transmissão de Fotos de Eventos em Tempo Real',
  description: 'Fotos tiradas pelo fotógrafo com câmera Canon direto para a nuvem. Convidados visualizam e baixam na hora via QR Code.',
  keywords: ['Maggon', 'Fotos em tempo real', 'Tethering Canon', 'Fotografia de eventos', 'QR Code fotos'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-[#090d16] text-gray-100 min-h-screen antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
