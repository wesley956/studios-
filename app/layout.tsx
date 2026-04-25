import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: {
    default: 'Studio+ Gestão',
    template: '%s | Studio+ Gestão'
  },
  description:
    'Sistema profissional para agenda, clientes, financeiro e mini site de studios, barbearias, salões e negócios da beleza.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${playfair.variable} min-h-screen bg-background text-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
