"""Tests de helpers de Supabase Storage."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

import supabase_client  # noqa: E402


def test_private_upload_uses_authenticated_url_and_private_bucket():
    mock_client = MagicMock()
    mock_client.storage.get_bucket.return_value = {"public": False}
    bucket = mock_client.storage.from_.return_value

    with patch("supabase_client.get_supabase_client", return_value=mock_client):
        url, err = supabase_client.upload_bytes_to_storage(
            "cedula-documents",
            "user-vet/cedula/doc.pdf",
            b"%PDF",
            "application/pdf",
            public=False,
        )

    assert err is None
    assert url == (
        "https://example.supabase.co/storage/v1/object/authenticated/"
        "cedula-documents/user-vet/cedula/doc.pdf"
    )
    mock_client.storage.update_bucket.assert_not_called()
    bucket.get_public_url.assert_not_called()


def test_public_upload_keeps_public_bucket_for_campaign_assets():
    mock_client = MagicMock()
    mock_client.storage.get_bucket.return_value = {"public": False}
    bucket = mock_client.storage.from_.return_value
    bucket.get_public_url.return_value = (
        "https://example.supabase.co/storage/v1/object/public/uploads/email/offer.png"
    )

    with patch("supabase_client.get_supabase_client", return_value=mock_client):
        url, err = supabase_client.upload_bytes_to_storage(
            "uploads",
            "email/offer.png",
            b"png",
            "image/png",
            public=True,
        )

    assert err is None
    assert url.endswith("/storage/v1/object/public/uploads/email/offer.png")
    mock_client.storage.update_bucket.assert_called_once_with(
        "uploads",
        options={"public": True},
    )
    bucket.get_public_url.assert_called_once_with("email/offer.png")


def test_resolve_cedula_document_url_does_not_make_bucket_public():
    with patch("supabase_client.get_storage_signed_url", return_value=("signed-url", None)):
        with patch("supabase_client.ensure_storage_bucket_public") as ensure_public:
            url, err = supabase_client.resolve_cedula_document_url(
                "https://example.supabase.co/storage/v1/object/authenticated/"
                "cedula-documents/user-vet/cedula/doc.pdf"
            )

    assert err is None
    assert url == "signed-url"
    ensure_public.assert_not_called()
