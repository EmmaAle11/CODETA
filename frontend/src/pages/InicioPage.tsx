import { TarjetaMenu } from '../shared/ui/TarjetaMenu';

export function InicioPage({ onIr }: { onIr: (vista: 'generales' | 'cliente') => void }) {
  return (
    <div className="gt-home">
      <TarjetaMenu
        icono="＋"
        titulo="Tarifas Generales"
        desc="Crea, consulta y edita las plantillas de cobro por aduana."
        onClick={() => onIr('generales')}
      />
      <TarjetaMenu
        icono="🔍"
        titulo="Tarifas por Cliente"
        desc="Personaliza una tarifa general y da seguimiento a su ciclo de vida."
        onClick={() => onIr('cliente')}
      />
    </div>
  );
}
