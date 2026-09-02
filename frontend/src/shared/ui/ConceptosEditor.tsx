import { useState } from 'react';
import type { Concepto } from '../../entities/tarifa/model/types';
import { Button } from './Button';

/**
 * Editor de la lista de conceptos que viaja como JSONB al backend.
 *
 * Dos formas según la columna destino (001_schema.sql):
 *   modo 'porcentaje' → servicios_conceptos: [{concepto, rate, minimo}]
 *   modo 'flat'       → cargos_adicionales:  [{concepto, monto}]
 *
 * El `rate` se guarda como fracción (0.0045), pero se captura como porcentaje
 * legible (0.45) — la conversión vive aquí para que ningún formulario la repita.
 */
export function ConceptosEditor({
  etiqueta, modo, conceptos, onChange,
}: {
  etiqueta: string;
  modo: 'porcentaje' | 'flat';
  conceptos: Concepto[];
  onChange: (c: Concepto[]) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [minimo, setMinimo] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  function agregar() {
    // Sin esto el formulario "no hace nada" al confirmar vacío y no explica por
    // qué — fue uno de los hallazgos reportados en pruebas.
    if (!nombre.trim()) return setAviso('Escribe el nombre del concepto.');
    if (!valor.trim()) return setAviso(modo === 'flat' ? 'Escribe el monto.' : 'Escribe el porcentaje.');
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) return setAviso('El valor debe ser un número mayor o igual a cero.');

    const nuevo: Concepto = modo === 'flat'
      ? { concepto: nombre.trim(), monto: numero }
      : { concepto: nombre.trim(), rate: numero / 100, minimo: minimo ? Number(minimo) : undefined };

    onChange([...conceptos, nuevo]);
    setNombre(''); setValor(''); setMinimo(''); setAviso(null);
  }

  function quitar(i: number) {
    onChange(conceptos.filter((_, idx) => idx !== i));
  }

  return (
    <fieldset className="gt-conceptos">
      <legend className="gt-conceptos__legend">{etiqueta}</legend>

      {conceptos.length > 0 && (
        <ul className="gt-conceptos__lista">
          {conceptos.map((c, i) => (
            <li key={`${c.concepto}-${i}`}>
              <span>{c.concepto}</span>
              <span className="gt-conceptos__valor">
                {modo === 'flat'
                  ? `$${Number(c.monto ?? 0).toLocaleString('es-MX')}`
                  : `${(Number(c.rate ?? 0) * 100).toFixed(2)}%${c.minimo ? ` (mín. $${Number(c.minimo).toLocaleString('es-MX')})` : ''}`}
              </span>
              <button type="button" className="gt-conceptos__quitar" onClick={() => quitar(i)} aria-label={`Quitar ${c.concepto}`}>×</button>
            </li>
          ))}
        </ul>
      )}

      {aviso && <div className="gt-aviso">{aviso}</div>}

      <div className="gt-conceptos__alta">
        <input className="gt-input" placeholder="Concepto" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input
          className="gt-input" type="number" step="0.01" min="0"
          placeholder={modo === 'flat' ? 'Monto (MXN)' : 'Porcentaje (%)'}
          value={valor} onChange={(e) => setValor(e.target.value)}
        />
        {modo === 'porcentaje' && (
          <input className="gt-input" type="number" step="0.01" min="0" placeholder="Mínimo (opcional)" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        )}
        <Button type="button" variant="ghost" onClick={agregar}>Agregar</Button>
      </div>
    </fieldset>
  );
}
