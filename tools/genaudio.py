#!/usr/bin/env python3
"""Generate stored MiMo dialogue: genaudio.py -i story.txt --voice sample.wav -o line.mp3."""
import argparse
import base64
import os
from pathlib import Path
import subprocess
import sys
import tempfile

import requests

API_URL = 'https://api.xiaomimimo.com/v1/chat/completions'
MODEL = 'mimo-v2.5-tts-voiceclone'
MIME = {'.mp3': 'audio/mpeg', '.wav': 'audio/wav'}


def generate_mp3(text, voice_file, api_key, timeout=120):
    voice_file = Path(voice_file)
    if voice_file.suffix.lower() not in MIME:
        raise ValueError('Reference voice must be MP3 or WAV')
    voice_b64 = base64.b64encode(voice_file.read_bytes()).decode('ascii')
    # Preserve the working MiMo message/audio schema, with the correct input MIME.
    payload = {
        'model': MODEL,
        'messages': [{'role': 'user', 'content': ''}, {'role': 'assistant', 'content': text}],
        'audio': {'format': 'mp3', 'voice': f'data:{MIME[voice_file.suffix.lower()]};base64,{voice_b64}'},
    }
    response = requests.post(API_URL, headers={'api-key': api_key, 'Content-Type': 'application/json'},
                             json=payload, timeout=timeout)
    if not response.ok:
        # Do not log response bodies: they can echo text, reference audio or credentials.
        raise RuntimeError(f'API request failed (HTTP {response.status_code})')
    try:
        data = base64.b64decode(response.json()['choices'][0]['message']['audio']['data'], validate=True)
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise RuntimeError('The API response did not contain valid base64 audio') from exc
    if not data:
        raise RuntimeError('The API returned empty audio')
    return data


def save_audio(mp3_data, output):
    output = Path(output)
    if output.suffix.lower() not in {'.mp3', '.wav'}:
        raise ValueError('Output must end in .mp3 or .wav')
    output.parent.mkdir(parents=True, exist_ok=True)
    # Write/convert alongside the destination and publish only a complete file.
    with tempfile.TemporaryDirectory(dir=output.parent) as directory:
        source = Path(directory) / 'source.mp3'
        source.write_bytes(mp3_data)
        if output.suffix.lower() == '.wav':
            converted = Path(directory) / 'converted.wav'
            try:
                subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), str(converted)], check=True)
            except FileNotFoundError as exc:
                raise RuntimeError('WAV output needs ffmpeg; install it or use MP3 output') from exc
            source = converted
        source.replace(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('-i', '--input', type=Path, required=True)
    parser.add_argument('-o', '--output', type=Path, required=True)
    parser.add_argument('--voice', type=Path, default=Path('output.mp3'))
    parser.add_argument('--timeout', type=int, default=120)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    key = os.environ.get('MIMO_API_KEY', '').strip()
    if not key:
        parser.error('Set MIMO_API_KEY in your environment before running')
    if not args.input.is_file() or not args.voice.is_file():
        parser.error('Input text and reference voice files must exist')
    if args.voice.suffix.lower() not in MIME:
        parser.error('Reference voice must end in .mp3 or .wav')
    if args.output.suffix.lower() not in {'.mp3', '.wav'}:
        parser.error('Output must end in .mp3 or .wav')
    if args.output.resolve() in {args.voice.resolve(), args.input.resolve()}:
        parser.error('Output cannot replace the reference voice or input text')
    if args.output.exists() and not args.force:
        parser.error(f'Output already exists: {args.output} (use --force to overwrite)')
    if args.timeout <= 0:
        parser.error('--timeout must be positive')
    try:
        text = args.input.read_text(encoding='utf-8-sig').strip()
        if not text:
            parser.error('Input text file is empty')
        print(f'Generating audio from {args.input} ...')
        save_audio(generate_mp3(text, args.voice, key, args.timeout), args.output)
        print(f'Saved: {args.output}')
        return 0
    except (OSError, ValueError, requests.RequestException, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
