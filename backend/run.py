from __future__ import annotations

import os
import socket
import sys

import uvicorn


def main() -> int:
    environment = os.getenv("ENVIRONMENT", "development").lower()
    default_host = "0.0.0.0" if environment == "production" else "127.0.0.1"
    host = os.getenv("BACKEND_HOST", default_host)
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "8000")))
    reload_enabled = environment != "production"

    if not _port_available(host, port):
        sys.stderr.write(
            "\nBackend startup failed: port "
            + str(port)
            + " is already in use on "
            + host
            + ".\n"
            + "Start on another port with one of:\n"
            + "  python -m uvicorn app.main:app --reload --port 8001\n"
            + "  $env:BACKEND_PORT='8001'; python run.py\n\n",
        )
        return 1

    uvicorn.run("app.main:app", host=host, port=port, reload=reload_enabled)
    return 0


def _port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        return sock.connect_ex((host, port)) != 0


if __name__ == "__main__":
    raise SystemExit(main())
