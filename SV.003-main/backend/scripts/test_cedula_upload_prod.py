"""Smoke test: registro + upload cédula en producción."""
from __future__ import annotations

import json
import random
import urllib.error
import urllib.request

API = "https://api.guiaa.vet"


def post_json(path: str, body: dict, headers: dict | None = None) -> tuple[int, dict | str]:
    hdrs = {"Content-Type": "application/json", **(headers or {})}
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(body).encode(),
        headers=hdrs,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, raw


def post_multipart(path: str, vet_id: str, token: str = "", nonce: str = "") -> tuple[int, str]:
  boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
  file_bytes = b"\xff\xd8\xff\xe0" + b"0" * 128
  body = (
      f"--{boundary}\r\n"
      f'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
      f"Content-Type: image/jpeg\r\n\r\n"
  ).encode() + file_bytes + f"\r\n--{boundary}--\r\n".encode()
  headers = {
      "Content-Type": f"multipart/form-data; boundary={boundary}",
      "x-veterinarian-id": vet_id,
  }
  if token:
      headers["Authorization"] = f"Bearer {token}"
  if nonce:
      headers["x-cedula-flow-nonce"] = nonce
  req = urllib.request.Request(f"{API}{path}", data=body, headers=headers, method="POST")
  try:
      with urllib.request.urlopen(req, timeout=60) as resp:
          return resp.status, resp.read().decode()
  except urllib.error.HTTPError as exc:
      return exc.code, exc.read().decode()


def main() -> None:
    email = f"testced{random.randint(10000, 99999)}@example.invalid"
    cedula = f"TEST{random.randint(10000, 99999)}"
    code, reg = post_json(
        "/api/auth/register",
        {
            "nombre": "Test Vet",
            "email": email,
            "telefono": "5512345678",
            "profesional_pais": "MX",
            "cedula_profesional": cedula,
            "especialidad": "Medicina General",
            "años_experiencia": 5,
            "institucion": "UNAM",
            "password": "Vet2024",
        },
    )
    print("register", code, "keys", list(reg.keys()) if isinstance(reg, dict) else reg)
    if code != 200 or not isinstance(reg, dict):
        return
    vet_id = reg["id"]
    token = reg.get("access_token", "")

    code2, body2 = post_multipart("/api/cedula/upload", vet_id)
    print("upload sin auth", code2, body2[:300])

    code3, body3 = post_multipart("/api/cedula/upload", vet_id, token=token)
    print("upload con token", code3, body3[:300])


if __name__ == "__main__":
    main()
