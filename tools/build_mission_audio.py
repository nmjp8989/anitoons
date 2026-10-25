#!/usr/bin/env python3
"""Build/cache one MP3 per mission dialogue. No API calls with --dry-run."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys

from genaudio import API_URL, MODEL, generate_mp3, save_audio

ROOT = Path(__file__).resolve().parents[1]
SLUG = re.compile(r'[A-Za-z0-9][A-Za-z0-9_-]{0,79}\Z')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def safe_id(value):
    if not isinstance(value, str) or not SLUG.fullmatch(value):
        raise ValueError(f'Invalid mission, speaker or dialogue ID: {value!r}')
    return value


def contained(root, value):
    result = (root / value).resolve()
    if not result.is_relative_to(root.resolve()):
        raise ValueError('Voice paths must stay inside the voice directory')
    return result


def plan(mission_paths, voice_dir, output_dir):
    voices = read_json(voice_dir / 'voices.json')
    jobs, manifests, seen = [], {}, set()
    voice_cache = {}
    for path in mission_paths:
        mission = read_json(path)
        mid = safe_id(mission['id'])
        if mid in seen:
            raise ValueError(f'Duplicate mission ID: {mid}')
        seen.add(mid)
        lines = {}
        default_speaker = mission.get('voiceSpeaker', 'harpreet')
        for did, dialogue in mission['dialogues'].items():
            safe_id(did)
            text = dialogue['text']
            if not isinstance(text, str) or not text.strip():
                raise ValueError(f'Empty/invalid text in {mid}/{did}')
            speaker = safe_id(dialogue.get('speaker', default_speaker))
            if speaker not in voices:
                raise ValueError(f'No voice configured for speaker {speaker}')
            voice = contained(voice_dir, voices[speaker])
            if voice.suffix.lower() not in {'.wav', '.mp3'} or not voice.is_file():
                raise ValueError(f'Missing MP3/WAV reference voice: {voice}')
            if voice not in voice_cache:
                voice_cache[voice] = hashlib.sha256(voice.read_bytes()).hexdigest()
            signature = json.dumps([API_URL, MODEL, text, speaker, voice_cache[voice], voice.suffix.lower()], ensure_ascii=False)
            digest = hashlib.sha256(signature.encode()).hexdigest()
            relative = f'{mid}/{did}-{digest[:20]}.mp3'
            destination = output_dir / relative
            lines[did] = {'text': text, 'speaker': speaker, 'src': 'audio/' + relative}
            if not destination.is_file() or not destination.stat().st_size:
                jobs.append((text, voice, destination))
        manifests[mid] = {'version': 1, 'mission': mid, 'lines': lines}
    return jobs, manifests


def build(jobs, manifests, output_dir, api_key, timeout=120):
    for index, (text, voice, destination) in enumerate(jobs, 1):
        print(f'Generating {index}/{len(jobs)}: {destination.name}')
        save_audio(generate_mp3(text, voice, api_key, timeout), destination)
    # Publish manifests only after all clips succeeded; completed clips survive retries.
    output_dir.mkdir(parents=True, exist_ok=True)
    for mid, manifest in manifests.items():
        destination = output_dir / f'{mid}.json'
        temporary = destination.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        temporary.replace(destination)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mission', action='append', type=Path, help='Mission JSON; repeat for multiple missions (default: all)')
    parser.add_argument('--voice-dir', type=Path, default=ROOT)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'missions/audio')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--max-new-lines', type=int, default=100)
    parser.add_argument('--timeout', type=int, default=120)
    args = parser.parse_args()
    try:
        if args.timeout <= 0 or args.max_new_lines < 0:
            raise ValueError('Timeout must be positive; max-new-lines cannot be negative')
        paths = args.mission or [ROOT / 'missions/mission.json', *sorted((ROOT / 'missions/adventures').glob('*.json'))]
        jobs, manifests = plan(paths, args.voice_dir, args.output_dir)
        print(f'{len(manifests)} missions; {len(jobs)} new/changed dialogue clips')
        if len(jobs) > args.max_new_lines:
            raise ValueError('New clip limit exceeded; inspect --dry-run and raise --max-new-lines deliberately')
        if args.dry_run:
            for _, _, destination in jobs:
                print(destination)
            return 0
        key = os.environ.get('MIMO_API_KEY', '').strip()
        if jobs and not key:
            raise ValueError('Set MIMO_API_KEY before generating audio')
        build(jobs, manifests, args.output_dir, key, args.timeout)
        print('Audio manifests ready')
        return 0
    except Exception as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
