# Mission voices

Mission JSON dialogue → cached MiMo MP3 per line → manifest → browser playback.
The browser uses stored audio, never the API key. No live TTS is needed in play.

## Setup

Only `MIMO_API_KEY` is needed in repository Settings → Secrets and variables →
Actions. The three reference samples are already committed at the repository root.
`voices.json` maps Harpreet to male_sample.wav, Meena to female_sample.wav and Kabir
 to kid_sample.mp3. There is no voice-reference URL secret or private ZIP step.

After a mission JSON or reference changes on main, Actions generates Mission 003
by default. Actions → Generate mission dialogue → Run workflow also lets you select
Mission 001, Mission 002 or all missions. Updating a secret alone does not start a
workflow. The workflow commits the generated MP3s and requests a GitHub Pages build.
The repository must permit Actions writes and have branch-based Pages configured.
Generated-only commits rebase onto main without force pushes. A conflicting concurrent
change can still require a rerun.

## Local commands

```sh
python3 -m pip install -r tools/requirements-audio.txt
python3 tools/build_mission_audio.py --mission missions/adventures/last-delivery.json --dry-run
# Set MIMO_API_KEY privately in the shell, then:
python3 tools/build_mission_audio.py --mission missions/adventures/last-delivery.json
python3 tools/genaudio.py -i story.txt --voice male_sample.wav -o test3.mp3
```

Use `--force` only for overwriting a single-file output. WAV output requires ffmpeg.
The batch builder hashes text, speaker, model and reference contents/type; unchanged
lines make zero API calls. Old files stay available for old mission versions.
All definitions and references are validated before generation. No automatic paid
API retries occur. A failed generation saves completed clips back to the repository when possible,
so reruns reuse them. An artifact is also kept for recovery if the commit fails.

Per-dialogue `speaker` selects a key in voices.json; `voiceSpeaker` sets a mission
default. Subtitles always remain available. Choice labels/UI hints are not voiced.
Mission 003 sequences await the actual audio end (or the player skipping) before
continuing. Mouth poses use an audio amplitude approximation, not phoneme alignment.
Multiple actors use pose banks from the existing Anitoons SVG rig.
