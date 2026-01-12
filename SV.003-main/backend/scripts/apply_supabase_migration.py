import argparse
import os
import sys
from pathlib import Path

import psycopg2


def _read_sql(sql_path: Path) -> str:
    if not sql_path.exists():
        raise FileNotFoundError(f"No existe el archivo SQL: {sql_path}")
    return sql_path.read_text(encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Aplica una migración SQL a la base Postgres de Supabase."
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("SUPABASE_DATABASE_URL") or os.getenv("SUPABASE_DB_URL") or "",
        help="Cadena de conexión Postgres. Alternativas: SUPABASE_DATABASE_URL / SUPABASE_DB_URL",
    )
    parser.add_argument(
        "--sql",
        default=str(
            Path(__file__).resolve().parents[1]
            / "supabase_migrations"
            / "20251229_cedula_verification.sql"
        ),
        help="Ruta al archivo .sql a ejecutar",
    )
    parser.add_argument(
        "--with-bucket",
        action="store_true",
        help="Intenta crear el bucket 'uploads' vía SQL (si tu Supabase permite escribir en storage.buckets).",
    )

    args = parser.parse_args()

    db_url = (args.db_url or "").strip()
    if not db_url:
        print(
            "Falta DB URL. Define SUPABASE_DATABASE_URL (o SUPABASE_DB_URL) o pasa --db-url.",
            file=sys.stderr,
        )
        return 2

    sql_path = Path(args.sql).resolve()
    sql = _read_sql(sql_path)

    print(f"Conectando a Postgres y aplicando: {sql_path}")
    conn = psycopg2.connect(db_url)
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(sql)

            if args.with_bucket:
                try:
                    cur.execute(
                        """
                        insert into storage.buckets (id, name, public)
                        values ('uploads', 'uploads', true)
                        on conflict (id) do nothing;
                        """
                    )
                except Exception as exc:  # pragma: no cover
                    # No todas las instancias permiten esto por permisos.
                    print(
                        f"[WARN] No se pudo crear bucket por SQL: {exc}. Créalo desde la UI de Supabase.",
                        file=sys.stderr,
                    )

        conn.commit()
        print("OK: migración aplicada.")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"ERROR aplicando migración: {exc}", file=sys.stderr)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())








