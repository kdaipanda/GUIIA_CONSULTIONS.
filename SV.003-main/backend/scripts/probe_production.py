#!/usr/bin/env python3
"""Diagnóstico rápido de producción guiaa.vet."""
import httpx

ORIGINS = ["https://guiaa.vet", "https://www.guiaa.vet"]
ENDPOINTS = [
    ("GET", "https://api.guiaa.vet/"),
    ("GET", "https://api.guiaa.vet/api/membership/packages"),
    ("POST", "https://api.guiaa.vet/api/auth/login"),
]

def main():
    with httpx.Client(timeout=20.0, follow_redirects=True) as client:
        print("=== Frontend ===")
        r = client.get("https://guiaa.vet")
        print("guiaa.vet", r.status_code, "->", r.url)
        r2 = client.get("https://www.guiaa.vet")
        print("www.guiaa.vet", r2.status_code, "->", r2.url)

        print("\n=== API ===")
        for origin in ORIGINS:
            print(f"\n-- Origin: {origin} --")
            for method, url in ENDPOINTS:
                headers = {"Origin": origin}
                try:
                    if method == "GET":
                        resp = client.get(url, headers=headers)
                    else:
                        resp = client.post(
                            url,
                            headers=headers,
                            json={"email": "probe@test.com", "cedula_profesional": "12345678"},
                        )
                    print(
                        method,
                        url.replace("https://api.guiaa.vet", ""),
                        resp.status_code,
                        "cors=",
                        resp.headers.get("access-control-allow-origin"),
                    )
                except Exception as exc:
                    print("FAIL", url, exc)

        print("\n=== SSL api.guiaa.vet ===")
        try:
            import ssl
            import socket

            ctx = ssl.create_default_context()
            with socket.create_connection(("api.guiaa.vet", 443), timeout=10) as sock:
                with ctx.wrap_socket(sock, server_hostname="api.guiaa.vet") as ssock:
                    cert = ssock.getpeercert()
                    print("subject", dict(x[0] for x in cert.get("subject", [])))
                    print("notAfter", cert.get("notAfter"))
        except Exception as exc:
            print("SSL FAIL", exc)


if __name__ == "__main__":
    main()
