'use client';

export function PrintButton({ label = 'Imprimir / salvar PDF' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white">
      {label}
    </button>
  );
}
