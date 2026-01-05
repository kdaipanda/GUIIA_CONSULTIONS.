# 🔧 Solución: Error "Permission Denied" en get_veterinarian_owner

## 📋 El Problema

La función `get_veterinarian_owner(uuid)` en Supabase está devolviendo "permission denied" incluso después de ejecutar GRANT.

**Causa probable**: La función es `SECURITY DEFINER` pero:
- No tiene permisos EXECUTE otorgados correctamente
- O el propietario de la función no tiene acceso a las tablas referenciadas

---

## ✅ Solución Rápida (Recomendada)

### Opción 1: Otorgar EXECUTE a PUBLIC (Más Fácil)

Ejecuta esto en **Supabase SQL Editor**:

```sql
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO public;
```

**Ventajas:**
- ✅ Solución rápida
- ✅ Funciona inmediatamente
- ✅ Permite que usuarios autenticados ejecuten la función

**Desventajas:**
- ⚠️ Más permisivo (pero seguro si tienes RLS habilitado)

---

## ✅ Solución Más Segura

### Opción 2: Otorgar EXECUTE solo a authenticated

```sql
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO authenticated;
```

**Ventajas:**
- ✅ Más seguro (solo usuarios autenticados)
- ✅ Recomendado para producción

---

## 🔧 Solución Completa (Si la Opción 1 no funciona)

### Paso 1: Verificar la Función

Ejecuta esto para ver el estado actual:

```sql
SELECT 
    p.proname as function_name,
    pg_get_userbyid(p.proowner) as owner,
    p.prosecdef as is_security_definer,
    array_to_string(p.proacl, ', ') as acl
FROM pg_proc p
WHERE p.proname = 'get_veterinarian_owner';
```

### Paso 2: Otorgar Permisos en las Tablas

Si la función es SECURITY DEFINER, asegúrate de que el propietario tenga acceso:

```sql
-- Otorgar permisos al propietario de la función (normalmente 'postgres')
GRANT SELECT ON public.profiles TO postgres;
GRANT SELECT ON public.veterinarians TO postgres;

-- Si la función usa otras tablas, agrégales también
-- GRANT SELECT ON public.consultations TO postgres;
```

### Paso 3: Otorgar EXECUTE

```sql
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO public;
-- O más seguro:
-- GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO authenticated;
```

---

## 📝 Script Completo (Todo en Uno)

He creado un archivo SQL completo: `fix_get_veterinarian_owner_permissions.sql`

**Para ejecutarlo:**

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Ve a **SQL Editor**
3. Abre el archivo `fix_get_veterinarian_owner_permissions.sql`
4. Copia y pega el contenido
5. Haz clic en **"Run"** o **"Execute"**

---

## 🎯 Recomendación

**Para resolver rápidamente**, ejecuta esto en Supabase SQL Editor:

```sql
-- Solución rápida y efectiva
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO public;
```

Si prefieres más seguridad:

```sql
-- Solución más segura
GRANT EXECUTE ON FUNCTION public.get_veterinarian_owner(uuid) TO authenticated;
```

---

## 🔍 Verificar que Funcionó

Después de ejecutar el GRANT, prueba la función:

```sql
-- Probar la función (reemplaza con un UUID real)
SELECT public.get_veterinarian_owner('tu-uuid-aqui');
```

Si no da error de permisos, ✅ **está resuelto**.

---

## 🆘 Si Aún No Funciona

### Verificar RLS (Row Level Security)

Si las tablas tienen RLS habilitado, la función SECURITY DEFINER debería funcionar. Si no:

1. Verifica que RLS esté habilitado en `public.profiles` y `public.veterinarians`
2. Verifica las políticas RLS

### Cambiar a SECURITY INVOKER (Última Opción)

Solo si es seguro y las otras opciones no funcionan:

```sql
ALTER FUNCTION public.get_veterinarian_owner(uuid) SECURITY INVOKER;
```

**⚠️ Advertencia**: Esto hace que la función use los permisos del llamador, no del propietario. Solo hazlo si es seguro.

---

## 📋 Pasos a Seguir

1. **Ejecuta el GRANT** (Opción 1 o 2 arriba)
2. **Prueba la función** para verificar
3. **Si funciona**: ✅ Listo
4. **Si no funciona**: Ejecuta el script completo `fix_get_veterinarian_owner_permissions.sql`

---

**¿Quieres que te guíe paso a paso para ejecutar esto en Supabase?** O si prefieres, puedo crear un script más específico según tus necesidades.

