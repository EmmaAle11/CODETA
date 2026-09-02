// ============================================================================
// GT · App.tsx — punto de montaje del frontend real (capa `app` de FSD).
//
// Sustituye al bundle en memoria que ocupaba la raíz (conservado en /demo).
// Sin react-router: un estado simple alterna entre 3 vistas, suficiente para
// esta SPA. Los datos vienen de entities/tarifa/api/tarifas.ts, el puente que
// ya hablaba con el backend real antes de que existiera esta pantalla.
// ============================================================================
import { useState } from 'react';
import { InicioPage } from '../pages/InicioPage';
import { TarifasGeneralesPage } from '../pages/TarifasGeneralesPage';
import { TarifasClientePage } from '../pages/TarifasClientePage';
import '../shared/ui/styles.css';

type Vista = 'inicio' | 'generales' | 'cliente';

export default function App() {
  const [vista, setVista] = useState<Vista>('inicio');

  return (
    <div className="gt-shell">
      <header className="gt-header">
        {vista !== 'inicio' && (
          <button className="gt-breadcrumb" onClick={() => setVista('inicio')}>← Inicio</button>
        )}
        <div className="gt-header__texto">
          <div className="gt-header__eyebrow">Plataforma DoxIA</div>
          <h1 className="gt-header__title"><span className="marca-gt">GT</span> · Gestor de Tarifas</h1>
          <p className="gt-header__subtitle">Constructor de tarifas aduanales</p>
        </div>
      </header>

      <div className="gt-body">
        {vista === 'inicio' && <InicioPage onIr={setVista} />}
        {vista !== 'inicio' && (
          <nav className="gt-nav">
            <button data-active={vista === 'generales'} onClick={() => setVista('generales')}>Tarifas Generales</button>
            <button data-active={vista === 'cliente'} onClick={() => setVista('cliente')}>Tarifas por Cliente</button>
          </nav>
        )}
        {vista === 'generales' && <TarifasGeneralesPage />}
        {vista === 'cliente' && <TarifasClientePage />}
      </div>
    </div>
  );
}
