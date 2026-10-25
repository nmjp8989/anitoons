#!/usr/bin/env python3
"""Download a private voice ZIP without printing its secret URL."""
import io
import os
from pathlib import Path
import stat
import zipfile

import requests

DEST = Path(__file__).resolve().parents[1] / 'voice-references'
LIMIT = 25 * 1024 * 1024


def main():
    url = os.environ.get('VOICE_REFERENCES_URL', '').strip()
    if not url.startswith('https://'):
        raise RuntimeError('Set VOICE_REFERENCES_URL to a direct HTTPS ZIP URL')
    try:
        with requests.get(url, stream=True, timeout=120) as response:
            if not response.ok:
                raise RuntimeError('Voice bundle download failed')
            payload = bytearray()
            for chunk in response.iter_content(65536):
                payload.extend(chunk)
                if len(payload) > LIMIT:
                    raise RuntimeError('Voice bundle exceeds 25 MB')
        with zipfile.ZipFile(io.BytesIO(payload)) as bundle:
            infos = bundle.infolist()
            if len(infos) > 100 or sum(item.file_size for item in infos) > LIMIT:
                raise RuntimeError('Voice bundle is too large')
            for item in infos:
                path = Path(item.filename)
                if len(path.parts) != 1 or path.name != item.filename or stat.S_ISLNK(item.external_attr >> 16):
                    raise RuntimeError('Voice ZIP must contain plain files without directories')
                if path.suffix.lower() not in {'.json', '.wav', '.mp3'}:
                    raise RuntimeError('Voice ZIP supports JSON, WAV and MP3 only')
            if 'voices.json' not in bundle.namelist():
                raise RuntimeError('Voice ZIP needs voices.json')
            DEST.mkdir(parents=True, exist_ok=True)
            for item in infos:
                (DEST / item.filename).write_bytes(bundle.read(item))
    except requests.RequestException:
        raise RuntimeError('Voice bundle download failed') from None
    print('Reference voices ready')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Transport exceptions may include signed URLs, so omit their details.
        raise SystemExit('Could not prepare reference voices. Check VOICE_REFERENCES_URL and ZIP contents.')
