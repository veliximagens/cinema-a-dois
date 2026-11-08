import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Cinema a Dois ❤️ — Assista a Filmes e Séries Juntos à Distância',
  description: 'Plataforma cinematográfica de cinema particular e compartilhamento de tela em alta definição para casais e amigos assistirem juntos.',
  openGraph: {
    title: 'Cinema a Dois ❤️ — Assista a Filmes e Séries Juntos à Distância',
    description: 'Plataforma cinematográfica de cinema particular e compartilhamento de tela em alta definição para casais e amigos assistirem juntos.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinema a Dois ❤️ — Assista a Filmes e Séries Juntos à Distância',
    description: 'Plataforma cinematográfica de cinema particular e compartilhamento de tela em alta definição para casais e amigos assistirem juntos.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
