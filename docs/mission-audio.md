# Stored dialogue pipeline

Mission JSON dialogue → one cached MiMo MP3 per line → manifest → browser playback.
This automates dialogue production, not whole mission writing, artwork or animation.
No API key or live TTS calls are used in the browser.

## One-time GitHub setup

Repository Settings → Secrets and variables → Actions → New repository secret:

1. `MIMO_API_KEY`: your MiMo key.
2. `VOICE_REFERENCES_URL`: a private direct HTTPS download URL for a ZIP containing
   `voices.json` plus reference WAV/MP3 files. See `voice-references/README.md`.

The current repository is public. The reference bundle stays private; generated
dialogue is public game content. Do not put the API key in source or mission JSON.
The connector cannot manage GitHub secrets; enter them in GitHub settings.

Actions → **Generate mission dialogue** → Run workflow. Subsequent mission JSON
changes on main trigger generation automatically. Secret updates do not trigger
a run; use Run workflow after first setup or replacing a voice bundle.
Actions must permit repository writes for the generated-audio commit.
If main requires PRs, the push will fail; retrieve the generated artifact and
commit it through the normal PR process instead. No force pushes are performed.

## Local use

```sh
python3 -m pip install -r tools/requirements-audio.txt
# Place the samples and voices.json in voice-references/ first.
python3 tools/build_mission_audio.py --dry-run
# Set MIMO_API_KEY privately in your shell, then:
python3 tools/build_mission_audio.py
```

Generate a single file using the original interface:

```sh
python3 tools/genaudio.py -i story.txt --voice output.wav -o test3.mp3
```

Use `--force` to replace an existing single-file output. WAV output requires
ffmpeg. WAV and MP3 voice inputs use their corresponding MIME type. The MiMo
request schema otherwise follows the user's working script; live API behavior
must be verified with a real key and sample.

## Per-character voices and caching

Every dialogue entry is generated, including hints/error responses under
`dialogues`. Choice labels and standalone UI hints are not spoken.
Set mission `voiceSpeaker` or per-dialogue `speaker` to a key in voices.json.
Otherwise `harpreet` is used.

The clip filename hashes exact text, model, endpoint, speaker and reference sample
contents/type. Unchanged lines make zero API calls. Existing files are never
overwritten. Old clips are kept so cached/previous mission versions keep working.
The default limit is 100 new clips per invocation; use `--dry-run` to inspect
the batch and `--max-new-lines` locally to change it. There are no automatic
API retries (a retry can cause duplicate billing).

The builder validates all missions and voice files before the first API call.
It saves clips as they complete, but only publishes manifests after the batch
succeeds. On Actions failure, download the `mission-dialogue` artifact and copy
its contents into `missions/audio/` before retrying if you want to preserve
completed clips. Otherwise the next runner can generate those lines again.

## Playback and animation hooks

The player fetches `missions/audio/<mission-id>.json` and plays the matching
line when a dialogue opens. New dialogue interrupts old audio; reset stops it;
the Sound button mutes both voice and music; tab hiding pauses voice. Missing
audio or text mismatches leave the subtitle playable without speech.

`mission-voice-start` includes `{id, speaker, audio}` in event detail.
`mission-voice-end` signals completion or interruption. These are hooks for the
upcoming multi-character timeline/rig integration; this change does not implement
lip-sync, character gestures or completion-triggered story sequences yet.

After generated audio is committed, use the normal static-site deployment.
GitHub-token commits do not trigger other push workflows; this workflow does
not automatically publish Pages. If needed, deploy manually after generation.
