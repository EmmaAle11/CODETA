import type { ReactNode } from 'react';

export function Card({ title, acciones, children }: { title: string; acciones?: ReactNode; children: ReactNode }) {
  return (
    <section className="gt-card">
      <header className="gt-card__head">
        <h2 className="gt-card__title">{title}</h2>
        {acciones}
      </header>
      <div className="gt-card__body">{children}</div>
    </section>
  );
}
