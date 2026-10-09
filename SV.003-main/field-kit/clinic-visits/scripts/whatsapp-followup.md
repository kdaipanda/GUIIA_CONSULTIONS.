# Follow-up WhatsApp (mismo día)

Pedir permiso verbal: “¿Le mando el link por WhatsApp?”

Reemplazar `{nombre}`, `{clinica}`, `{ciudad}`, links UTM de `qr/urls.md`.

---

## A) Se registró en la visita

```
Hola {nombre}, soy [tu nombre] de GUIAA. Gracias por recibirme en {clinica}.

Tu prueba de 3 consultas ya está lista en https://guiaa.vet/app

Si te traba algo al primer caso, escríbeme aquí y te ayudo.
```

## B) Vio demo, no cerró

```
Hola {nombre}, gracias por los minutos en {clinica}.

Como te comenté, puedes probar GUIAA gratis (3 consultas):
{link_registro_utm}

Te dejo también el resumen de una hoja. Cualquier duda, aquí estoy.
```

## C) Solo dejó tarjeta / recepción

```
Hola, visitamos {clinica} hoy con información de GUIAA (software clínico para MVZ).

Prueba gratis 3 consultas:
{link_registro_utm}

Si el doctor/a prefiere, con gusto agendo 10 minutos esta semana.
```

## D) Callback agendado

```
Hola {nombre}, quedamos el {día} a las {hora} para retomar GUIAA en {clinica}.

Link por si quiere adelantar el registro:
{link_registro_utm}

Confirmo el día anterior. ¡Gracias!
```

## E) No interesado (opcional, solo si pidió material)

No insistir. Si dejó número solo para el PDF:

```
Hola {nombre}, como pediste, te comparto el one-pager de GUIAA.
Sin seguimiento adicional de mi parte. Éxito con la clínica.
```

---

## Timing

| Resultado | Cuándo enviar |
|-----------|----------------|
| registered / demo_done | ≤ 2 h |
| callback | Al anotar + recordatorio 1 día antes |
| leave_behind | Mismo día si hay número |
| not_interested | No enviar |
