"""
Simple reverse proxy to forward requests from localhost:8000 to localhost:3001
"""
import asyncio
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

app = FastAPI(title="Proxy Server")

BACKEND_URL = "http://127.0.0.1:8001"


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy(path: str, request: Request):
    """Forward all requests to backend on port 3001"""
    
    # Construir URL completa del backend
    url = f"{BACKEND_URL}/{path}"
    if request.query_params:
        url += f"?{request.query_params}"
    
    # Leer el cuerpo de la solicitud
    body = await request.body()
    
    # Hacer la solicitud al backend
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=url,
            content=body,
            headers=request.headers,
            follow_redirects=True
        )
    
    # Retornar la respuesta
    return StreamingResponse(
        iter([response.content]),
        status_code=response.status_code,
        headers=dict(response.headers)
    )


if __name__ == "__main__":
    import uvicorn
    print("🔄 Proxy corriendo en http://127.0.0.1:8000")
    print(f"📡 Forwarding a {BACKEND_URL}")
    uvicorn.run(app, host="127.0.0.1", port=8000)
