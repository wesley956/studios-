'use client';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main style={{ minHeight: '100vh', padding: 24, fontFamily: 'Arial, sans-serif', background: '#0f172a', color: '#e5e7eb' }}>
          <div style={{ maxWidth: 720, margin: '64px auto', border: '1px solid #334155', borderRadius: 28, padding: 32, background: '#111827' }}>
            <p style={{ color: '#67e8f9', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12 }}>Studio+ Gestão</p>
            <h1 style={{ fontSize: 32, marginTop: 12 }}>Erro inesperado</h1>
            <p style={{ lineHeight: 1.7, color: '#cbd5e1' }}>
              O sistema encontrou uma falha inesperada. Tente recarregar. Se continuar, envie o código para o suporte.
            </p>
            {error.digest ? <p>Código: <strong>{error.digest}</strong></p> : null}
            <button onClick={reset} style={{ marginTop: 16, borderRadius: 16, padding: '12px 18px', background: '#06b6d4', color: '#03111a', border: 0 }}>
              Tentar novamente
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
