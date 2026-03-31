# 🚀 Guía de Deploy - guiaa.vet

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   guiaa.vet     │────▶│  api.guiaa.vet  │────▶│    Supabase     │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│    Vercel       │     │ Railway/Render  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1️⃣ Configurar DNS en Google Domains

Ve a: https://domains.google.com → guiaa.vet → DNS

### Records necesarios:

| Tipo | Nombre | Datos | TTL |
|------|--------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| CNAME | api | tu-app.railway.app | 3600 |

> **Nota**: El CNAME de `api` depende de dónde hostees el backend:
> - **Railway**: `tu-app.railway.app`
> - **Render**: `tu-app.onrender.com`

---

## 2️⃣ Deploy Frontend en Vercel

### Opción A: Desde CLI
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

### Opción B: Desde GitHub
1. Ve a https://vercel.com/new
2. Importa tu repositorio
3. Configura:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Variables de entorno en Vercel:
```
REACT_APP_BACKEND_URL = https://api.guiaa.vet
REACT_APP_SUPABASE_URL = https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY = tu-anon-key
```

### Configurar dominio:
1. En Vercel Dashboard → tu proyecto → Settings → Domains
2. Agrega: `guiaa.vet` y `www.guiaa.vet`
3. Vercel te mostrará los DNS records (ya los configuramos arriba)

---

## 3️⃣ Deploy Backend en Railway

### Pasos:
1. Ve a https://railway.app y crea cuenta
2. New Project → Deploy from GitHub
3. Selecciona tu repo y la carpeta `backend`
4. Railway detectará Python automáticamente

### Variables de entorno en Railway:
```
CORS_ALLOW_ORIGINS = https://guiaa.vet,https://www.guiaa.vet
SUPABASE_URL = https://tu-proyecto.supabase.co
SUPABASE_KEY = tu-service-role-key
ANTHROPIC_API_KEY = tu-api-key
ANTHROPIC_MODEL = claude-3-5-sonnet-20241022
STRIPE_API_KEY = sk_live_xxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxx
```

### Configurar dominio personalizado:
1. En Railway → tu servicio → Settings → Domains
2. Add Custom Domain: `api.guiaa.vet`
3. Railway te dará un CNAME target (agrégalo en Google Domains)

---

## 4️⃣ Verificar Supabase

Tu Supabase ya está configurado. Solo asegúrate de:

1. **Row Level Security (RLS)**: Habilitado en todas las tablas
2. **CORS**: En Supabase Dashboard → Settings → API → Add `https://guiaa.vet` a allowed origins

---

## 5️⃣ Checklist Final

- [ ] DNS propagado (puede tomar 24-48h)
- [ ] Frontend accesible en https://guiaa.vet
- [ ] Backend accesible en https://api.guiaa.vet/docs
- [ ] HTTPS funcionando (certificados automáticos)
- [ ] Login/Register funcionando
- [ ] Consultas IA funcionando
- [ ] Pagos Stripe funcionando

---

## 🔧 Comandos útiles

### Verificar DNS
```bash
# Windows
nslookup guiaa.vet
nslookup api.guiaa.vet

# Linux/Mac
dig guiaa.vet
dig api.guiaa.vet
```

### Ver logs
```bash
# Vercel
vercel logs

# Railway
railway logs
```

---

## 🆘 Troubleshooting

### "CORS error"
- Verifica `CORS_ALLOW_ORIGINS` en el backend
- Asegúrate de incluir `https://` en los orígenes

### "Failed to fetch"
- Verifica que `REACT_APP_BACKEND_URL` apunte a `https://api.guiaa.vet`
- Verifica que el backend esté corriendo

### "SSL certificate error"
- Espera unos minutos, los certificados se generan automáticamente
- Verifica los DNS records

---

## 📞 Soporte

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs









