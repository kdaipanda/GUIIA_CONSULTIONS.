# Configuración de Claude en server_simple.py

## Parámetros Actuales

### Modelo
- **Modelo**: `claude-sonnet-4-5-20250929` (configurado en `.env` como `ANTHROPIC_MODEL`)
- **Límite máximo de tokens de salida**: 200,000 tokens (límite del modelo)

### Configuración de Tokens
- **max_tokens**: `16,000` (configurado en `server_simple.py` línea 109)
  - Valor por defecto: 16,000 tokens
  - Puede sobrescribirse con `ANTHROPIC_MAX_TOKENS` en `.env`
  - **Nota**: Claude Sonnet 4 soporta hasta 200,000 tokens de salida

### Otros Parámetros
- **temperature**: `0.01` (configurado en línea 110)
  - Controla la creatividad/aleatoriedad (0.0 = determinista, 1.0 = muy creativo)
  - **Nota**: Con temperatura 0.01, Claude tendrá respuestas muy deterministas y consistentes
- **top_p**: `0.9` (configurado en línea 111)
  - Nucleus sampling (considera tokens hasta acumular 90% de probabilidad)
  - Controla la diversidad de tokens considerados
- **top_k**: `50` (configurado en línea 110)
  - Limita las opciones de tokens a considerar
- **top_p**: `0.95` (configurado en línea 109)
  - Nucleus sampling (considera tokens hasta acumular 95% de probabilidad)

## Ubicación en el Código

### Función `send_llm_message` (línea 186)
```python
def _call_claude() -> str:
    response = anthropic_client.messages.create(
        model=ANTHROPIC_MODEL or "claude-3-5-sonnet-20241022",
        max_tokens=ANTHROPIC_MAX_TOKENS,  # 100,000 tokens
        temperature=ANTHROPIC_TEMPERATURE,  # 0.5
        top_k=ANTHROPIC_TOP_K,  # 50
        system=system_prompt,  # instrucciones_veterinarias.txt
        messages=[...]
    )
```

## Cómo Aumentar el Límite

Si necesitas aumentar aún más el límite de tokens:

1. **Opción 1: Modificar el código**
   - Cambiar línea 107 de `server_simple.py`:
   ```python
   ANTHROPIC_MAX_TOKENS = _get_int_env("ANTHROPIC_MAX_TOKENS", 200000)  # Máximo del modelo
   ```

2. **Opción 2: Variable de entorno**
   - Agregar en `backend/.env`:
   ```
   ANTHROPIC_MAX_TOKENS=200000
   ```

## Verificación

Para verificar la configuración actual:
```bash
cd backend
python -c "from server_simple import ANTHROPIC_MAX_TOKENS, ANTHROPIC_MODEL; print(f'Modelo: {ANTHROPIC_MODEL}'); print(f'Max tokens: {ANTHROPIC_MAX_TOKENS}')"
```

