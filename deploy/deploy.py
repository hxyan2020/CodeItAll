#!/usr/bin/env python3
"""Deploy CodeItAll static site to DigitalOcean droplet (port 8099)."""
from __future__ import annotations

import io
import tarfile
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
APP_DIR = "/var/www/codeitall"
HOST = "188.166.214.47"
USER = "root"
PORT = 8099
KEY_CANDIDATES = [
    Path(__file__).resolve().parents[2] / "hx-bots-monitoring" / "deploy" / "id_ed25519",
    Path.home() / ".ssh" / "id_ed25519",
]

NGINX_CONF = f"""
server {{
    listen {PORT};
    listen [::]:{PORT};
    server_name _;

    root {APP_DIR};
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {{
        expires 7d;
        add_header Cache-Control "public";
    }}
}}
"""


def connect() -> paramiko.SSHClient:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    last_err = None
    for key in KEY_CANDIDATES:
        if not key.is_file():
            continue
        try:
            c.connect(HOST, username=USER, key_filename=str(key), timeout=60)
            print(f"SSH ok via {key}")
            return c
        except Exception as e:
            last_err = e
    raise SystemExit(f"SSH failed: {last_err}")


def run(c: paramiko.SSHClient, cmd: str) -> str:
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def main() -> None:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for path in DOCS.rglob("*"):
            if path.is_file():
                tar.add(path, arcname=path.relative_to(DOCS).as_posix())
    buf.seek(0)
    print(f"Archive size: {buf.getbuffer().nbytes} bytes")

    c = connect()
    sftp = c.open_sftp()
    run(c, f"mkdir -p {APP_DIR}")
    remote_tgz = "/tmp/codeitall-docs.tgz"
    with sftp.file(remote_tgz, "wb") as rf:
        rf.write(buf.read())
    run(c, f"rm -rf {APP_DIR}/* && tar -xzf {remote_tgz} -C {APP_DIR} && rm -f {remote_tgz}")

    conf_path = "/etc/nginx/sites-available/codeitall"
    with sftp.file(conf_path, "w") as rf:
        rf.write(NGINX_CONF)
    run(c, "ln -sfn /etc/nginx/sites-available/codeitall /etc/nginx/sites-enabled/codeitall")
    run(c, "nginx -t && systemctl reload nginx")
    check = run(c, f"curl -s -o /dev/null -w '%{{http_code}}' http://127.0.0.1:{PORT}/").strip()
    print(f"Local health: HTTP {check}")
    print(f"Live URL: http://{HOST}:{PORT}/")
    sftp.close()
    c.close()


if __name__ == "__main__":
    main()
