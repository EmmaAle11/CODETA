/**
 * Tarjeta de navegación de los menús. Es el mismo patrón que ya usaba
 * InicioPage (gt-home-card), extraído para que las tres pantallas de menú lo
 * compartan en vez de repetir el marcado.
 *
 * `destacada` reproduce el tratamiento del artefacto original para "Tarifas en
 * Proceso": ancho completo, borde e icono en el naranja de marca, contador y
 * chevron.
 */
export function TarjetaMenu({
  icono, titulo, desc, onClick, destacada = false, contador,
}: {
  icono: string;
  titulo: string;
  desc: string;
  onClick: () => void;
  destacada?: boolean;
  contador?: number;
}) {
  return (
    <button
      type="button"
      className={`gt-home-card${destacada ? ' gt-home-card--destacada' : ''}`}
      onClick={onClick}
    >
      <div className="gt-home-card__icon">{icono}</div>
      <div className="gt-home-card__cuerpo">
        <div className="gt-home-card__title">
          {titulo}
          {contador != null && contador > 0 && <span className="gt-home-card__contador">{contador}</span>}
        </div>
        <div className="gt-home-card__desc">{desc}</div>
      </div>
      {destacada && <span className="gt-home-card__chevron" aria-hidden="true">›</span>}
    </button>
  );
}

/** Botón de regreso al menú de la sección. Reusa el estilo del breadcrumb. */
export function VolverAlMenu({ onClick, children = '← Volver' }: { onClick: () => void; children?: string }) {
  return <button type="button" className="gt-breadcrumb gt-breadcrumb--seccion" onClick={onClick}>{children}</button>;
}
