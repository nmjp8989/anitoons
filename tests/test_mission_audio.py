"""No paid requests: exercise the batch/cache and provider adapter with fakes."""
import base64
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import build_mission_audio as batch
import genaudio


class AudioTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.voices = self.root / 'voices'
        self.voices.mkdir()
        (self.voices / 'voices.json').write_text('{"harpreet":"hero.wav","shopkeeper":"shop.mp3"}')
        (self.voices / 'hero.wav').write_bytes(b'fake-wav')
        (self.voices / 'shop.mp3').write_bytes(b'fake-mp3')
        self.output = self.root / 'audio'
        self.mission = self.root / 'mission.json'
        self.definition = {'id': 'delivery', 'dialogues': {
            'greeting': {'text': 'Hello!'},
            'parcelTaken': {'text': 'Thank you.', 'speaker': 'shopkeeper'},
        }}
        self.write()

    def write(self):
        self.mission.write_text(json.dumps(self.definition))

    def plan(self):
        return batch.plan([self.mission], self.voices, self.output)

    def test_cache_text_and_voice_changes(self):
        jobs, manifests = self.plan()
        self.assertEqual(len(jobs), 2)
        with patch.object(batch, 'generate_mp3', return_value=b'fake-audio') as request:
            batch.build(jobs, manifests, self.output, 'test-only')
        self.assertEqual(request.call_count, 2)
        self.assertEqual(len(self.plan()[0]), 0)
        self.definition['dialogues']['greeting']['text'] = 'Hello again!'
        self.write()
        self.assertEqual(len(self.plan()[0]), 1)
        self.definition['dialogues']['greeting']['text'] = 'Hello!'
        self.write()
        (self.voices / 'shop.mp3').write_bytes(b'different-voice')
        self.assertEqual(len(self.plan()[0]), 1)

    def test_failed_batch_does_not_publish_manifest(self):
        jobs, manifests = self.plan()
        with patch.object(batch, 'generate_mp3', side_effect=[b'good', RuntimeError('failed')]):
            with self.assertRaises(RuntimeError):
                batch.build(jobs, manifests, self.output, 'test-only')
        self.assertFalse((self.output / 'delivery.json').exists())
        self.assertEqual(len(self.plan()[0]), 1)

    def test_missing_voice_and_traversal_fail_before_generation(self):
        self.definition['dialogues']['parcelTaken']['speaker'] = 'missing'
        self.write()
        with self.assertRaises(ValueError):
            self.plan()
        self.definition['dialogues'] = {'../escape': {'text': 'No'}}
        self.write()
        with self.assertRaises(ValueError):
            self.plan()

    def test_mimo_payload_uses_wav_mime_and_decodes_audio(self):
        response = Mock(ok=True)
        response.json.return_value = {'choices': [{'message': {'audio': {
            'data': base64.b64encode(b'output-mp3').decode()
        }}}]}
        with patch.object(genaudio.requests, 'post', return_value=response) as request:
            result = genaudio.generate_mp3('Hello', self.voices / 'hero.wav', 'test-only', 3)
        self.assertEqual(result, b'output-mp3')
        self.assertTrue(request.call_args.kwargs['json']['audio']['voice'].startswith('data:audio/wav;base64,'))
        response.ok = False
        response.status_code = 429
        with patch.object(genaudio.requests, 'post', return_value=response):
            with self.assertRaisesRegex(RuntimeError, 'HTTP 429'):
                genaudio.generate_mp3('Hello', self.voices / 'hero.wav', 'test-only')


if __name__ == '__main__':
    unittest.main()
