# Reference voices

Place `harpreet.wav` here (or change `voices.json` to point to an MP3).
Use a reference voice you own or have permission to use.

Add speaker mappings such as `"shopkeeper": "shopkeeper.mp3"`, then set
`"speaker": "shopkeeper"` on a dialogue entry. Mission-level `voiceSpeaker`
sets its default; otherwise the builder uses `harpreet`.

Only voices.json and this README are tracked. Audio samples are ignored.
For Actions, create a ZIP containing voices.json and reference samples directly
inside it (no containing folder). Store it at a private HTTPS download URL and
add that URL as repository Actions secret `VOICE_REFERENCES_URL`. Use a direct
file URL, not a web page. Signed URLs work until they expire.
The runner never commits or uploads reference samples. Generated mission audio
is committed to this public repository.
