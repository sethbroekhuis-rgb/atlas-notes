# Atlas Notes - iPhone offline companion (Prototype v0.1)

Atlas Notes is a **notes-and-photos-only** Home Screen web app for use alongside Project Atlas on Windows. No accounts, databases on the internet, or paid app hosting are required.

## Publish the app for free using GitHub Pages

1. On a personal GitHub account, create a new repository named `atlas-notes` and select **Public** (needed for GitHub Pages on GitHub Free). Make sure it contains no company or confidential information.
2. Extract this ZIP onto your computer.
3. In your new GitHub repository, select **Add file > Upload files** and upload all the files from this folder **not the ZIP itself**. The root of the repository must contain `index.html`, `app.js`, `styles.css`, `zip.js`, `service-worker.js`, `manifest.webmanifest` and the PNG icon files. Commit the upload.
4. Open repository **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main`, folder `/(root)`, then click **Save**.
5. Once deployed, your site URL will usually be `https://YOUR-GITHUB-USERNAME.github.io/atlas-notes/`. Use the **Visit site** link in GitHub's Pages settings to get the exact URL.
6. On your iPhone, open the URL in **Safari**. Tap **Share > Add to Home Screen**, turn on **Open as Web App**, and tap **Add**.
7. Launch **Atlas Notes** from the Home Screen. Test saving a note and photo, then turn on Airplane Mode and verify that you can reopen it and see the note. Do this before relying on it.

GitHub Pages hosts only the app's public HTML/JavaScript/CSS/images. Notes and photos are stored locally on the iPhone using IndexedDB; no note/photo data is deliberately uploaded anywhere by the app.

## How to use v0.1

- **Capture**: Type a title and/or note, optionally attach up to 20 photos, and tap **Save note**. You can later edit or delete a saved note.
- **Saved**: Shows notes that are stored locally and waiting for a transfer.
- **Transfer**: Choose **Optimized** or **Original** photo transfer quality, tap **Prepare transfer ZIP**, then use **Share to Files** (preferred on iPhone) or **Download ZIP**.
- **Import receipt**: The future Windows importer will create a receipt proving the import succeeded. Only reading a matching receipt permits deletion of the imported notes/photos from the iPhone. This safety mechanism is present, but the Windows importer is **not yet included in this v0.1 release**. Therefore, do not manually delete notes merely because you created a ZIP.

## USB file transfer to Windows

Safari-installed web apps do not appear directly as File Sharing apps in Apple Devices for Windows. For a fully offline cable workflow, use a separate iPhone app that supports Apple's USB File Sharing, such as **Documents by Readdle**. Documents supports ZIP files and File Sharing.

Proposed workflow once the Windows importer is built:

1. Export/Share the ZIP from Atlas Notes into Documents on your iPhone (the exact Share-sheet wording may vary by iOS version).
2. Connect your iPhone to Windows by USB.
3. In **Apple Devices** for Windows, choose your iPhone > **Files** > **Documents**, then copy the ZIP to the PC.
4. Import the ZIP into Project Atlas's Windows Inbox using the future receiver.
5. The receiver verifies the notes/photos, imports them, and generates a JSON receipt.
6. Copy the receipt back into Documents using Apple Devices and open it using the Atlas Notes **Read import receipt** file chooser on the iPhone.
7. After you approve the matching receipt, Atlas Notes deletes only the successfully imported, unmodified notes/photos.

This transfer workflow needs testing on your actual iPhone/Windows setup. The Windows receiver and end-to-end USB test are the next phase.

## Privacy and limitations

- **No server or cloud synchronization.** The app has no remote API calls; only the app files are downloaded from GitHub Pages for installation/updates.
- **Not yet production-ready for irreplaceable records.** iOS web storage may be removed under device storage pressure or by clearing website data. Transfer important notes regularly; a ZIP is a backup only once you've confirmed it is safely stored on your PC.
- **GitHub Pages source is public.** Never commit exported notes, photos, backups, or company documents to this repository.
- **No Windows Inbox import yet.** The ZIP export and the phone-side receipt validation are implemented; the Windows ingestion and receipt generation still need to be developed.
- **No automatic background transfers.** Cable/Files transfers are manual; the application itself remains offline.

## Files

- `index.html` - UI structure
- `styles.css` - phone layout
- `app.js` - local note storage, photo handling, exports, receipt verification
- `zip.js` - local ZIP packer (no third-party dependencies)
- `manifest.webmanifest` - installable app metadata
- `service-worker.js` - offline app-shell caching
- `icon-180.png`, `icon-192.png`, `icon-512.png` - app icons

Version: prototype v0.1.
