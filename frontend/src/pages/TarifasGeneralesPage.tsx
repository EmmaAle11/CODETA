import { useRef, useState } from 'react';
import { CrearTarifaGeneralForm } from '../features/crear-tarifa-general/CrearTarifaGeneralForm';
import { TablaTarifasGenerales, type TablaTarifasGeneralesHandle } from '../widgets/tabla-tarifas-generales/TablaTarifasGenerales';
import { TarjetaMenu, VolverAlMenu } from '../shared/ui/TarjetaMenu';
import type { TarifaGeneral } from '../entities/tarifa/model/types';

// Mismo menú intermedio que tenía el artefacto original: dos tarjetas lado a
// lado, sin destacada (la destacada solo existía en Tarifas por Cliente).
type Vista = 'menu' | 'crear' | 'consultar';

export function TarifasGeneralesPage() {
  const tabla = useRef<TablaTarifasGeneralesHandle>(null);
  const [vista, setVista] = useState<Vista>('menu');
  // El mismo formulario sirve para crear y para editar: "Editar" en la tabla
  // solo le pasa la tarifa a precargar y salta a esa sub-vista.
  const [editando, setEditando] = useState<TarifaGeneral | null>(null);

  function alMenu() {
    setEditando(null);
    setVista('menu');
  }

  if (vista === 'menu') {
    return (
      <div className="gt-home">
        <TarjetaMenu
          icono="＋"
          titulo="Crear Tarifa General"
          desc="Define una nueva tarifa general por aduana, operación y modalidad."
          onClick={() => { setEditando(null); setVista('crear'); }}
        />
        <TarjetaMenu
          icono="🔍"
          titulo="Consultar Tarifas Generales"
          desc="Busca y filtra el catálogo de tarifas generales."
          onClick={() => setVista('consultar')}
        />
      </div>
    );
  }

  return (
    <>
      <VolverAlMenu onClick={alMenu} />
      {vista === 'crear' && (
        <CrearTarifaGeneralForm
          tarifa={editando}
          onGuardada={() => { tabla.current?.recargar(); setEditando(null); }}
          onCancelarEdicion={() => setEditando(null)}
        />
      )}
      {vista === 'consultar' && (
        <TablaTarifasGenerales
          ref={tabla}
          onEditar={(t) => { setEditando(t); setVista('crear'); }}
          editandoId={editando?.id ?? null}
        />
      )}
    </>
  );
}
