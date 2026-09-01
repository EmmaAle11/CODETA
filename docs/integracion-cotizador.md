# Integración GT ↔ Cotizador (QuoteForm.tsx)

El Cotizador del monolito calcula **todo en el frontend** dentro del `useMemo`
`totals`. Hoy tiene los `rate`/`min` y los conceptos fijos **quemados** en
cadenas `if/else`. GT los reemplaza por datos reales vía un endpoint.

## Contrato del endpoint

```
GET /api/gt/cotizador/resolver
    ?aduana=Veracruz
    &tipoOperacion=Importación
    &modalidadEnvio=FCL
    &tipoMercancia=Mercancía general
```

Respuesta:

```json
{
  "encontrada": true,
  "aduana": "Veracruz",
  "honorarios": { "rate": 0.0045, "min": 6500 },
  "serviciosComplementarios": { "rate": 0.0035, "min": 4550 },
  "conceptosFijos": {
    "validacion": 1000,
    "previo": 1000,
    "sellosFiscales": 260,
    "cnt": 65,
    "vucem": 1000,
    "reconocimientoAduanero": 0
  }
}
```

Coincide con el contrato recomendado en
`cotizador-contexto-para-gestor-tarifas.json → punto_de_integracion_recomendado`.

## Dónde se conecta en el código del Cotizador

1. En el `useMemo totals`, bloque **"✅ NUEVAS REGLAS TARIFAS"** (paso 11):
   sustituir el `if/else` de `rate/min` por los valores de `honorarios` y
   `serviciosComplementarios` que devuelve el endpoint.
2. En `applySuggestedFees`, bloque **"REGLAS SEGÚN COMBINACIÓN"**: sustituir la
   tabla quemada de conceptos fijos por `conceptosFijos`.

## Performance

`totals` se recalcula en cada cambio del formulario. **No** llames al endpoint en
cada tecleo: cárgalo/cachea al montar el formulario (o cuando cambien las 4
dimensiones) y lee del caché en memoria.

```ts
// Al montar el formulario o al cambiar {aduana, operación, modalidad, mercancía}
const tarifa = await TarifasAPI.resolverCotizador({
  aduana, tipoOperacion, modalidadEnvio, tipoMercancia,
});
// guarda `tarifa` en un ref/estado y úsalo dentro de `totals`
```

## Correcciones del legado que GT ya respeta

- **CNT = $65** (no $50). Sale del catálogo, nunca hardcodeado.
- Sin defaults inventados de Validación/Previo ($800/$800): todo viene de la
  tarifa vigente por aduana.
- Cada aduana es un registro independiente (Veracruz/Manzanillo/Lázaro Cárdenas
  no comparten fila aunque tengan los mismos valores).
