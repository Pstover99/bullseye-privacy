# Privacy Policy for Bullseye Ballistics

Last updated: September 25, 2026

Bullseye Ballistics ("Bullseye," "the app") is a long-range shooting ballistics
calculator developed by Core Bridge ("we," "us"). This policy explains what the app
accesses on your device and how that information is handled. In short: Bullseye works on your
device. There is one exception, it is optional, and it is off unless you switch it on — you can
create an account so your data survives a lost phone. Without an account, none of your data
leaves your phone. We run no server of our own, we show no ads, we use no analytics or
tracking, and we do not sell or share your data.

## Information the app accesses

Bullseye does not require an account, and every feature works without one. If you choose to
create one for cloud backup it asks for an email address and a password, or uses your Google
account if you prefer that — see **Cloud backup** below. To provide its features, the app may
use the following device capabilities, all processed locally on your device:

- **Location (GPS).** Used only to compute the Coriolis effect and magnetic declination
  for a more accurate firing solution, and to record the conditions at the time of a
  logged shot. Your location is used on the device and is never sent to us or to any
  third party. It is deliberately left out of cloud backup as well: a backed-up shot
  carries its range, conditions and result, but not where you were standing.
- **Bluetooth and nearby devices.** Used only to connect to optional environmental
  sensors (such as anemometers and weather meters) so the app can read live wind,
  temperature, pressure, and humidity. On some Android versions the operating system
  requires the location permission in order to scan for Bluetooth devices; the app does
  not use this permission to track you.
- **Camera and photo picker (optional).** The Group Analyzer can measure a shot group
  from a photograph of the target. Taking the photo hands the job to your device's own
  camera app — Bullseye does not request the camera permission and has no access to the
  camera itself. You may instead choose an existing image, which your device's photo
  picker provides one file at a time; the app has no access to the rest of your photo
  library. Any image you use is copied into the app's private storage, is never
  uploaded, and is deleted when you delete the group it belongs to.

- **Microphone (optional, off by default).** One feature uses it, and it is off unless you
  turn it on.

  *Voice shot calls* (Settings → Voice shot calls). When it is on, the app listens while
  a target solution is on screen so you can say "hit" or "miss low left" instead of
  tapping. Speech is recognised **on your phone**, by a model shipped inside the app —
  **no audio is recorded, saved or sent anywhere.** The microphone is closed the moment
  you leave the solution screen or the app goes to the background, and the only thing
  kept is the shot you called, exactly as if you had tapped it. The app also keeps the
  words it thought it heard on screen so you can see and undo a mistake; that text is
  never stored.

  **Your voice is never uploaded**, because it is never written down in the first place.

  An earlier version also included a hidden diagnostic that *did* record short audio clips at
  a shooting range, so we could measure how phone microphones behave around gunfire. **That
  tool has been removed**, and any clips it left on your phone are deleted automatically the
  next time you open the updated app.

- **Cloud backup (optional, off by default).** You can create an account — with an email
  address and a password, or with Google if you prefer — to back up your rifles, loads, shot
  log, measured groups, matches and settings so they survive a lost or replaced phone, and to
  keep two of your own devices in step. **You do not need a Google
  account**, and you do not need an account at all to use the app. It is off until you create
  one, and signing out stops it.

  Backup is switched on and off on the Cloud backup screen, and it is off until you turn it on.

  If you sign up with an email address we ask you to confirm it, which is what lets you reset
  a forgotten password later. Your password is stored by our authentication provider in hashed
  form; we never see it. You can delete the account, and everything backed up to it, from
  Settings → Account and backup, or follow
  [these instructions](https://pstover99.github.io/bullseye-privacy/delete-account/) if you no
  longer have the app installed. What is uploaded is the same data the app already stores locally — your
  rifles, loads, shot log, measured groups, matches and settings. **Not** uploaded: audio,
  target photographs, your location (including the location saved with each shot and today's
  weather and location on the Solution screen), paired Bluetooth devices, and anything about how
  you use the app. The backup is stored
  under your own account and no other user can read it.

  Until this feature the app had no internet permission at all, and this policy said so.
  That is no longer true and we would rather say it plainly than leave a stale promise
  standing. Everything else still works with no network connection.

The app does not access your contacts or your photo library at large.

## Data stored on your device

Your profiles, shot logs, measured groups, matches, settings, and sensor readings are stored
locally on your device. Target photographs used by the Group Analyzer are stored in the app's
private storage, which other apps cannot read. Uninstalling the app removes this data.

Unless you create an account and switch on cloud backup, none of it is uploaded anywhere. If
you do, a copy of your rifles, loads, shot log, groups, matches and settings is stored under
your own account — target photographs, audio and location are never part of that copy. Your phone stays
the original; the backup is only ever a copy of it.

## Sharing features

The app includes optional features that let you share your own data with people you
choose, using apps already on your device (for example a messaging app or Bluetooth).
Sharing is initiated entirely by you and goes directly to the recipient you select. We
do not receive, store, or process shared files.

- **Shot-string export.** You can export your shot-string data to a file. By default,
  location information is removed from exported files; including it is an explicit,
  optional choice you control.
- **Group image export.** You can share a measured group as an image of your target
  photo with the measurements drawn on it. The image is re-rendered before it leaves
  the app, which removes hidden photo metadata such as the GPS coordinates a phone
  camera may embed — so a shared image does not reveal where it was taken.

## Data collection and third parties

We do not sell, rent, or trade your personal data, and we do not profile you. The app contains
no advertising and no analytics or tracking SDKs — Google Analytics and Crashlytics were
removed in August 2026 and are not coming back.

We use one third-party service, and only if you create an account: **Google Firebase**, which
handles sign-in and stores the backup. Google processes that data on our behalf as our service
provider. If you never create an account, none of your data is sent to them or to us.

## Purchases

Bullseye Ballistics is a one-time purchase on Google Play with every feature included.
The app contains no subscriptions, no in-app purchases, and no advertising. Your
payment is handled entirely by Google Play; we never see or store your payment details.

## Children

Bullseye is intended for an adult audience and is not directed to children.

## Changes to this policy

We may update this policy from time to time. Changes will be posted on this page with an
updated "Last updated" date.

## Contact

If you have questions about this policy, contact us at parkerstover243@gmail.com.
