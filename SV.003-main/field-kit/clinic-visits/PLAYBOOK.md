# Playbook del día — visitas a clínicas

## Antes de salir (noche previa / mañana)

- [ ] Ruta del día en `territory/route-template.csv` (8–15 visitas realistas)
- [ ] Tablet cargada + hotspot móvil
- [ ] Cuenta demo / trial lista (login guardado)
- [ ] One-pagers + tarjetas (mín. 30 de cada)
- [ ] Credencial / gafete con nombre + “GUIAA — guiaa.vet”
- [ ] WhatsApp Business abierto en el celular de campo
- [ ] Revisar `compliance/mx-claims.md` (30 segundos)

## Ventanas horarias recomendadas

| Momento | Por qué |
|---------|---------|
| 10:30–13:00 | Tras la primera oleada de consultas |
| 16:00–18:30 | Antes del cierre / entre citas |
| Evitar | Cirugía programada, vacunación masiva, sábados saturados |

Si están en consulta: **dejar tarjeta + pedir horario de regreso** (anotar en bitácora).

## En la puerta (30–45 s)

1. Presentarte con nombre + GUIAA
2. Pedir 2 minutos con el MVZ o encargado
3. Si no: ¿quién decide el software / quién registra historiales?

Frase base:

> “Buenas, soy [Nombre] de GUIAA, software clínico para veterinarios. ¿Tienen 2 minutos? Le dejo una prueba de 3 consultas gratis y un resumen de una hoja.”

## Dentro del consultorio (5–12 min)

Seguir orden del agente field sales:

1. Discovery corto (`scripts/discovery-questions.md`)
2. Pitch 90s (`scripts/pitch-90s.md`)
3. Demo tablet (`scripts/demo-checklist.md`)
4. Cierre: registro ahora **o** QR + tarjeta
5. Pedir WhatsApp para enviar el enlace (opt-in verbal)

## Resultados posibles (marcar en visit-log)

| Código | Significado | Acción mismo día |
|--------|------------|------------------|
| `registered` | Se registró en la visita | WA de bienvenida + oferta |
| `demo_done` | Vio demo, no cerró | WA + link registro UTM |
| `callback` | Pidió volver / llamar | Agendar en ruta |
| `leave_behind` | Solo dejó material | WA si dio número |
| `not_interested` | No | Cerrar, no insistir |
| `gatekept` | No pasó de recepción | Tarjeta + horario |

## Meta diaria (referencia)

- **Visitas tocadas:** 10–15
- **Demos:** ≥ 4
- **Registros:** ≥ 1–2
- **Callbacks agendados:** ≥ 2

## Cierre del día (obligatorio)

1. Completar `visit-log.csv`
2. Enviar todos los follow-ups WA (`scripts/whatsapp-followup.md`)
3. Fotos de one-pagers rotos / faltantes → reimprimir
4. Ajustar ruta de mañana (priorizar callbacks)
