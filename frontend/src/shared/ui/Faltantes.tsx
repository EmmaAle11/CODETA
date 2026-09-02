/**
 * Explica POR QUÉ un botón de envío está deshabilitado.
 *
 * Un botón inerte y sin explicación fue exactamente el bug que reportó una
 * tester: llenaba el formulario, el botón seguía apagado, y nada decía qué
 * faltaba. Cada formulario arma su lista de campos pendientes y la pasa aquí.
 */
export function AvisoFaltantes({ faltantes }: { faltantes: string[] }) {
  if (faltantes.length === 0) return null;
  return (
    <div className="gt-aviso" role="status">
      Falta llenar: {faltantes.join(', ')}.
    </div>
  );
}
