# Android release and APK publishing

## Keep the signing key outside this repository

The Android signing key is the identity of Kobo Circle on users' phones. Generate it once, keep it for every future release, and **never commit it, email it, paste it into chat, or put its passwords in this repository, `.env`, CI logs, or Vercel environment variables**.

On a secure administrator machine, create a private directory outside this checkout (for example `~/.secrets/kobo-circle/`, permission `700`) and run the following command. Replace the placeholders before running it; use long, unique passwords from a password manager.

```bash
mkdir -p ~/.secrets/kobo-circle && chmod 700 ~/.secrets/kobo-circle
keytool -genkeypair -v \
  -keystore ~/.secrets/kobo-circle/kobo-circle-release.jks \
  -storetype JKS \
  -alias kobo-circle-release \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass 'STORE_PASSWORD_FROM_PASSWORD_MANAGER' \
  -keypass 'KEY_PASSWORD_FROM_PASSWORD_MANAGER' \
  -dname 'CN=Kobo Circle, OU=Mobile, O=Kobo Circle, L=YOUR_CITY, ST=YOUR_STATE, C=NG'
chmod 600 ~/.secrets/kobo-circle/kobo-circle-release.jks
```

Store the `.jks` file in encrypted, access-controlled backup storage and store both passwords plus the alias in the organisation's password manager. Losing this key prevents trusted upgrades for existing installations. Limit access to release administrators. The command above is documentation only: do not use its placeholder passwords.

## Build a signed release

`android/app/build.gradle` refuses to create a release APK unless all four secrets below are supplied. They may be Gradle properties or environment variables; environment variables avoid writing secrets to a project file.

```bash
export KOBO_CIRCLE_RELEASE_STORE_FILE="$HOME/.secrets/kobo-circle/kobo-circle-release.jks"
export KOBO_CIRCLE_RELEASE_STORE_PASSWORD='store password from password manager'
export KOBO_CIRCLE_RELEASE_KEY_ALIAS='kobo-circle-release'
export KOBO_CIRCLE_RELEASE_KEY_PASSWORD='key password from password manager'
cd android && ./gradlew assembleRelease
```

The artifact is `android/app/build/outputs/apk/release/app-release.apk`. Before publishing, check its certificate fingerprint against the retained signing key and install it on a physical device or emulator:

```bash
keytool -list -v -keystore "$KOBO_CIRCLE_RELEASE_STORE_FILE" -alias "$KOBO_CIRCLE_RELEASE_KEY_ALIAS"
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p app.kobocircle.android 1
```

An emulator/device is required for the install and launch checks. Confirm the app opens the production login screen and that a user can sign in; a successful Gradle compile is not an installation test.

## Publish every native release

1. Increase `versionCode` and `versionName` in `android/app/build.gradle`. Set `public/update-manifest.json` `latestNativeVersion` to the **identical** `versionName` in the same change.
2. Build and test the signed APK using the commands above.
3. Copy the tested artifact to the exact deployed static path: `cp android/app/build/outputs/apk/release/app-release.apk public/downloads/kobo-circle.apk`.
4. Commit the APK, manifest version update, and source changes. Deploy the commit to Vercel.
5. After deployment, verify the public file—not only the manifest—returns HTTP 200 and an Android APK MIME type: `curl -fsSI https://kobo-circle.vercel.app/downloads/kobo-circle.apk`. Record its byte size with `wc -c public/downloads/kobo-circle.apk`.

The `/downloads/` path is deliberately excluded from authentication middleware so an installer can fetch it without a Kobo Circle session. Do not update `update-manifest.json` until the matching APK is at that static path in the deployed release.
