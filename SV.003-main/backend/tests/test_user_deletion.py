"""Tests para eliminación completa de usuarios."""

from unittest.mock import MagicMock, patch

import pytest

from user_deletion import delete_user_account, purge_user_related_data


def test_delete_user_account_not_found():
    with patch("user_deletion.get_profile_by_email", return_value=(None, None)):
        ok, error, detail = delete_user_account("missing@test.com")
    assert ok is False
    assert "no encontrado" in (error or "").lower()
    assert detail == {}


def test_delete_user_account_verifies_removal():
    profile = {"id": "user-1", "email": "vet@test.com"}
    mock_client = MagicMock()
    mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "user-1"}]
    )

    with patch("user_deletion.get_profile_by_email", side_effect=[(profile, None), (None, None)]):
        with patch("user_deletion.get_profile", return_value=(None, None)):
            with patch("user_deletion.purge_user_related_data", return_value={"consultations": 2}):
                with patch("user_deletion.get_supabase_client", return_value=mock_client):
                    ok, error, detail = delete_user_account("vet@test.com")

    assert ok is True
    assert error is None
    assert detail["verified"] is True
    assert detail["removed"]["consultations"] == 2


def test_delete_user_account_fails_if_profile_still_exists():
    profile = {"id": "user-1", "email": "vet@test.com"}
    mock_client = MagicMock()
    mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    with patch("user_deletion.get_profile_by_email", return_value=(profile, None)):
        with patch("user_deletion.get_profile", return_value=(profile, None)):
            with patch("user_deletion.purge_user_related_data", return_value={}):
                with patch("user_deletion.get_supabase_client", return_value=mock_client):
                    ok, error, detail = delete_user_account("vet@test.com")

    assert ok is False
    assert "sigue existiendo" in (error or "").lower()


def test_purge_user_related_data_calls_tables():
    mock_client = MagicMock()
    mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{}]
    )
    mock_client.table.return_value.delete.return_value.ilike.return_value.execute.return_value = MagicMock(
        data=[]
    )
    mock_client.storage.from_.return_value.list.return_value = []

    with patch("user_deletion.get_supabase_client", return_value=mock_client):
        with patch("user_deletion._purge_user_storage", return_value=0):
            removed = purge_user_related_data("550e8400-e29b-41d4-a716-446655440000", "a@b.com")

    assert "consultations" in removed
    assert mock_client.table.call_count >= 4
