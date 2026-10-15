# Atlas Notes v0.2 — offline iPhone companion for Project Atlas

Atlas Notes is a **text-and-photo-only** Home Screen app. No App Store release, account, online database, or paid hosting is required. The application code can be served free on GitHub Pages; your notes and photos are saved **locally on your iPhone**, not uploaded to GitHub.

## Update the version already installed on your iPhone

**IMPORTANT: Update the existing GitHub Pages repository in place. Do not delete the installed Atlas Notes icon, clear its website data, or move the app to a different website. Doing any of those can erase or disconnect your locally stored notes.**

1. On Windows, extract the new `atlas_notes_pwa_v0.2.zip`.
2. Open the **same personal GitHub repository** that hosts your working Atlas Notes app. Replace the repository-root app files with the new ones (`index.html`, `app.js`, `styles.css`, `service-worker.js`, etc.) and commit the changes. Do **not** upload the ZIP itself or place the files in a nested folder. Do not upload any transfer ZIPs, company documents, photographs, or personal notes to GitHub.
3. After GitHub Pages publishes the update, connect your iPhone to the internet temporarily so the **app code** can update. Reopen Atlas Notes from the existing Home Screen icon. It may take closing and reopening the app again for its offline cache to refresh.
4. Open **Transfer**. The heading should display **`USB workflow · v0.2`** and the new **Clear Transferred Notes** button. If you still see "Read import receipt", refresh the website in Safari while online, then completely close and reopen the existing Home Screen app.
5. Confirm your existing saved notes are still visible **before** you clear anything. Atlas Notes keeps the same IndexedDB storage name (`atlas-notes-v1`).

## Regular capture and USB-transfer workflow

1. **Capture**: Create a note, add text and/or photos, and save it. Notes and full-resolution photos remain locally stored on the iPhone until you delete or clear them.
2. **Transfer**: Choose `Optimized` or `Original` photo quality; tap **Prepare transfer ZIP**; then tap **Share to Files** (or **Download ZIP**). The transfer includes all currently saved notes, with their source timestamps. Nothing is deleted by exporting.
3. **On iPhone (Files app)**: Save the exported ZIP to **On My iPhone → Chrome**. This is the USB-visible location you confirmed works with your setup.
4. **On Windows**: Connect the iPhone by cable, open **Apple Devices → Files → Chrome**, and copy the ZIP to a local Windows folder.
5. **Project Atlas v0.5 or later**: Open **Notes Inbox → Import from iPhone** and import the ZIP. Check the text notes **and photographs** appear correctly. Keep the ZIP or the Atlas-verified backup copy as a recovery copy.
6. **Back on iPhone**: Open **Atlas Notes → Transfer → Clear Transferred Notes**, carefully read the filename and counts, and confirm. Only notes that were included in the latest exported ZIP **and have not been edited since** are removed, along with their attached photos. Notes created or edited after that export remain on the phone. You do **not** have to transfer a JSON import receipt back to the phone.

**IMPORTANT: The phone cannot know whether Windows successfully imported the ZIP. Clearing is manual and irreversible. Never clear a batch until you personally verify the import in Windows and retain a safe backup.**

## Photo transfer options

- `Optimized`: smaller JPEG copies, up to 1600 pixels on the longest side.
- `Original`: preserves photo resolution and source format whenever possible.
- The app holds full-resolution images on the phone until you use **Clear Transferred Notes**. After clearing, if you selected Optimized for the export, the original high-resolution photos are no longer available from Atlas Notes. Choose Original for important defect or equipment photographs.

## What changed from v0.1

- Replaced the **Read import receipt** step with a **manual Clear Transferred Notes button**.
- The button is enabled only when the app has an exported batch with unchanged notes remaining. It shows the batch filename and notes eligible for removal.
- Exported notes edited later are preserved. New notes are also preserved.
- One confirmation is required before permanently deleting eligible notes and their locally stored photos.
- Existing v0.1 export batches are recognized when upgrading, so you can clear previously imported v0.1 notes after checking them on Windows.
- The ZIP import format (schema version 1) has **not** changed, so the Project Atlas v0.5 Windows importer remains compatible.
- Updated offline service-worker cache identifier so the Home Screen app can receive the new UI and logic.

## Privacy and limitations

- Everything in the core capture app works offline once it has been installed and cached.
- GitHub Pages hosts **only the app files**. Do not upload notes or ZIP exports to the public repository.
- No automatic USB synchronization or automated import verification is implemented; cable transfer and clearing require your action.
- Because iOS Home Screen app data can be lost if website data is cleared or the app is removed, import valuable records to Windows regularly and save verified backup files before clearing.
- The ZIP is a standard uncompressed archive with `manifest.json` and `photos/...`. See `TRANSFER_FORMAT.md` for technical details.
- Chrome's Files-folder visibility in Apple Devices has been confirmed on your setup but could differ on other iPhones or versions.
