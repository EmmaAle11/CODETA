import { useRef, useState, useEffect } from 'react';
import { CrearTarifaClienteForm } from '../features/crear-tarifa-cliente/CrearTarifaClienteForm';
import { TablaTarifasCliente, type TablaTarifasClienteHandle } from '../widgets/tabla-tarifas-cliente/TablaTarifasCliente';
import { TarjetaMenu, VolverAlMenu } from '../shared/ui/TarjetaMenu';
import { TarifasAPI } from '../entities/tarifa/api/tarifas';

// Menú intermedio del artefacto original: "Tarifas en Proceso" destacada a
// ancho completo y, debajo, crear y consultar lado a lado.
type Vista = 'menu' | 'proceso' | 'crear' | 'consultar';

export function TarifasClientePage() {
  const enProceso = useRef<TablaTarifasClienteHandle>(null);
  const archivadas = useRef<TablaTarifasClienteHandle>(null);
  const [vista, setVista] = useState<Vista>('menu');
  const [cuantasEnProceso, setCuantasEnProceso] = useState<number | undefined>(undefined);

  // El contador del badge de la tarjeta destacada, igual que en el artefacto.
  // Se recuenta al volver al menú para que refleje los avances de estado.
  useEffect(() => {
    if (vista !== 'menu') return;
    let vivo = true;
    TarifasAPI.listarCliente({ enProceso: '1' })
      .then((t) => vivo && setCuantasEnProceso(t.length))
      .catch(() => vivo && setCuantasEnProceso(undefined));
    return () => { vivo = false; };
  }, [vista]);

  // Un avance de estado (sobre todo validación→archivada) saca una fila de "en
  // proceso" y la mete en "archivadas". Las dos tablas consultan por separado,
  // así que las dos se recargan ante cualquier cambio.
  function recargarTodo() {
    enProceso.current?.recargar();
    archivadas.current?.recargar();
  }

  if (vista === 'menu') {
    return (
      <div className="gt-home">
        <TarjetaMenu
          destacada
          icono="🕐"
          titulo="Tarifas en Proceso"
          desc="Tarifas generadas que están en algún punto del ciclo de vida (emisión, envío, validación)."
          contador={cuantasEnProceso}
          onClick={() => setVista('proceso')}
        />
        <TarjetaMenu
          icono="＋"
          titulo="Crear Tarifa para Cliente"
          desc="Personaliza una tarifa general y ánclala a un cliente (RFC)."
          onClick={() => setVista('crear')}
        />
        <TarjetaMenu
          icono="🔍"
          titulo="Consultar Tarifas de Clientes"
          desc="Archivo por niveles de las tarifas que completaron su ciclo (archivadas)."
          onClick={() => setVista('consultar')}
        />
      </div>
    );
  }

  return (
    <>
      <VolverAlMenu onClick={() => setVista('menu')} />
      {vista === 'proceso' && (
        <TablaTarifasCliente ref={enProceso} titulo="Tarifas en Proceso" query={{ enProceso: '1' }} mostrarAccion onCambio={recargarTodo} />
      )}
      {vista === 'crear' && (
        <CrearTarifaClienteForm onCreada={recargarTodo} />
      )}
      {vista === 'consultar' && (
        <TablaTarifasCliente ref={archivadas} titulo="Consultar Tarifas de Clientes" query={{ estado: 'archivada' }} />
      )}
    </>
  );
}
