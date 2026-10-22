# Anitoons

Anitoons is an original character-animation and lip-sync shorts project.

## Reference app: Dolltoon

- Google Play package: `com.colossalentertainment.dolltoon`
- Publisher: Colossal Entertainment
- Play listing: https://play.google.com/store/apps/details?id=com.colossalentertainment.dolltoon
- Dolltoon is a **third-party proprietary app**, not part of this repository.

The first research step is inspecting the format and user-facing capabilities of an authorized, locally acquired Dolltoon APK or XAPK. See [the reference guide](docs/dolltoon-reference.md).

### Decode an APK or XAPK locally

Install Java, [Apktool](https://apktool.org/) and `unzip`, then run:

```bash
bash tools/decompile_dolltoon.sh /path/to/Dolltoon.apk
# Or for modern split-app bundles:
bash tools/decompile_dolltoon.sh /path/to/Dolltoon.xapk
```

The script writes the archive checksum, extracted package files and decoded resources/smali to `reference/dolltoon/` **on your computer**. These files are ignored by Git because they may contain third-party copyrighted code and graphics. Do not copy Dolltoon's proprietary source or artwork into Anitoons without permission.

Apktool decodes Android resources and Dalvik bytecode into smali; it **does not recover the original Android Studio source project**. For higher-level Java-like inspection you can also use [JADX](https://github.com/skylot/jadx).

## Planned MVP

Original customizable characters, lip-sync from audio, scene/background selection, a few reusable animations, and vertical-video export. Implementation has not begun.
