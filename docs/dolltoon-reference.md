# Dolltoon reference notes

**App:** Dolltoon – Cartoon Creator / Avatar Creator  
**Publisher:** Colossal Entertainment  
**Package ID:** `com.colossalentertainment.dolltoon`  
**Listing:** https://play.google.com/store/apps/details?id=com.colossalentertainment.dolltoon

## Observed user-facing capabilities

The public Play listing describes character/avatar customization (hair, eyes, face and clothes), color/style selections, custom/photo backgrounds, drawing and social sharing. These are inspiration for Anitoons' **own** implementation, not evidence that Dolltoon has a 3D animation or lip-sync engine.

## Acquisition and inspection

Google Play exposes an install flow, not a public APK download URL. Versions distributed elsewhere may be **XAPK** bundles containing split APKs, rather than one `.apk`. Prefer an APK obtained from your own Android device via an authorized route; use third-party mirrors cautiously and verify package/signature/hash.

Use `bash tools/decompile_dolltoon.sh /path/to/file.xapk` after installing Apktool. The output goes under `reference/dolltoon` locally and is intentionally excluded from Git. Inspect only where permitted and do not ship third-party code, original art, fonts or assets with Anitoons without rights.

Apktool outputs resource XML, resources and smali bytecode. Decompiled output is not the original development source. Split APKs may contain binary resources that require additional tooling.

## Anitoons original MVP direction

1. Original character creation or legally licensed character import.
2. Generate mouth movement based on audio and timing.
3. Character idle/talk/laugh and simple expression states.
4. Switchable background scenes and optional imported image.
5. Portrait MP4 export for shorts.

## Status

- Reference app and downloadable packaging format identified.
- Repository tooling created.
- **APK acquisition, checksum verification and decompilation have not yet been performed.**
