# URLs y QR para visitas en clínica

## Parámetros UTM (obligatorios)

| Parámetro | Valor |
|-----------|--------|
| `utm_source` | `clinic_visit` |
| `utm_medium` | `qr` \| `whatsapp` \| `one_pager` \| `card` |
| `utm_campaign` | `clinic_visit_{ciudad}_{semana}` ej. `clinic_visit_cdmx_w30` |
| `utm_content` | opcional: `rep_{nombre}` o `colonia_del_valle` |

## Links listos (copiar y generar QR)

### Registro / landing

```
https://guiaa.vet/?utm_source=clinic_visit&utm_medium=qr&utm_campaign=clinic_visit_cdmx_w30
```

### Membresía / oferta (si usas cupón)

```
https://guiaa.vet/app/membership?utm_source=clinic_visit&utm_medium=qr&utm_campaign=clinic_visit_cdmx_w30&promo=FRIENDS40
```

### WhatsApp negocio (ajustar número real)

```
https://wa.me/525620690369?text=Hola%20GUIAA%2C%20me%20visitaron%20en%20la%20cl%C3%ADnica%20y%20quiero%20la%20prueba%20de%203%20consultas
```

## Cómo generar el QR

### Opción A — script del repo

```bash
cd SV.003-main/field-kit/clinic-visits
python3 scripts/generate_qr.py
```

Genera PNGs en `qr/generated/`.

### Opción B — manual

1. Abrir un generador QR (o Canva)
2. Pegar la URL con UTM
3. Descargar PNG 1024×1024
4. Insertar en `print/one-pager.html` y `print/leave-behind-card.html` (o pegar al imprimir)

## Atribución

En Analytics / Admin, filtrar `utm_source=clinic_visit` para medir registros de campo vs digital.
