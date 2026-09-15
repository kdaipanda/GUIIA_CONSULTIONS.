from server_simple import (
    _create_anthropic_message_with_sampling_fallback,
    _is_anthropic_sampling_error,
    _strip_anthropic_sampling_params,
)


class FakeAPIStatusError(Exception):
    def __init__(self, status_code, message=None, body=None):
        super().__init__(message or "")
        self.status_code = status_code
        self.message = message
        self.body = body


def test_sampling_retry_detects_type_error():
    exc = TypeError("Messages.create() got an unexpected keyword argument 'temperature'")

    assert _is_anthropic_sampling_error(exc) is True


def test_sampling_retry_detects_anthropic_400_body():
    exc = FakeAPIStatusError(
        400,
        body={"error": {"message": "temperature is not supported for this model"}},
    )

    assert _is_anthropic_sampling_error(exc) is True


def test_sampling_retry_ignores_unrelated_api_errors():
    exc = FakeAPIStatusError(400, body={"error": {"message": "max_tokens is too large"}})

    assert _is_anthropic_sampling_error(exc) is False


def test_strip_anthropic_sampling_params_leaves_core_request():
    kwargs = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 900,
        "temperature": 0.2,
        "top_p": 0.9,
        "top_k": 50,
        "extra_body": {"temperature": 0.2},
        "messages": [],
    }

    _strip_anthropic_sampling_params(kwargs)

    assert kwargs == {
        "model": "claude-sonnet-4-6",
        "max_tokens": 900,
        "messages": [],
    }


def test_create_retries_without_sampling_after_anthropic_400():
    calls = []
    kwargs = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 900,
        "temperature": 0.2,
        "top_k": 50,
        "messages": [],
    }

    def create_func(next_kwargs):
        calls.append(dict(next_kwargs))
        if len(calls) == 1:
            raise FakeAPIStatusError(
                400,
                body={"error": {"message": "temperature is not supported for this model"}},
            )
        return {"ok": True}

    result = _create_anthropic_message_with_sampling_fallback(
        kwargs,
        create_func,
        warn_label="test",
    )

    assert result == {"ok": True}
    assert "temperature" in calls[0]
    assert calls[1] == {"model": "claude-sonnet-4-6", "max_tokens": 900, "messages": []}
