# Atlas Notes v0.2 transfer ZIP format (schema version 1)

The phone produces a ZIP archive using the ZIP **stored** method. It can be imported directly by the offline Project Atlas v0.5 Windows prototype; the file format is unchanged from Atlas Notes v0.1.

The archive contains `manifest.json` and optional `photos/<note UUID>/<photo UUID>.<ext>` attachments. The manifest has this shape:

```json
{
  "format": "atlas-notes-transfer",
  "schemaVersion": 1,
  "applicationVersion": "0.2",
  "batchId": "<UUID>",
  "exportedAt": "<ISO-8601>",
  "photoQuality": "optimized",
  "notes": [
    {
      "id": "<UUID>",
      "title": "Example",
      "body": "Captured observation",
      "createdAt": "<ISO-8601>",
      "updatedAt": "<ISO-8601>",
      "attachments": [
        {
          "id": "<UUID>",
          "originalName": "image.heic",
          "path": "photos/<note-id>/<photo-id>.jpg",
          "mimeType": "image/jpeg",
          "bytes": 123456,
          "sha256": "<lowercase SHA256 of attachment bytes>",
          "quality": "optimized"
        }
      ]
    }
  ]
}
```

## Import validation

The Windows importer should validate the ZIP format and schema; reject unsafe archive paths, missing photos, size mismatches, and failed SHA-256 checks; deduplicate by note ID and revision; and preserve timestamps/attachments. The latest Atlas Windows prototype also creates a verified backup and a JSON import receipt. The phone no longer needs the receipt: the user manually confirms successful Windows import and chooses **Clear Transferred Notes**.

## Manual clearing safeguard

After **Share to Files** or **Download ZIP**, the iPhone stores the latest export batch metadata (note IDs and `updatedAt` revisions) in its existing local IndexedDB `batches` store. **Clear Transferred Notes** requires explicit user confirmation, and deletes only current note records whose revisions still match the batch; their local photo records are deleted in the same atomic transaction. Newly captured notes, edited notes, and notes outside the latest export batch are retained. This prevents accidental removal caused by unrelated changes after the export, but it **does not verify the Windows import**.

On first launch of v0.2, an existing v0.1 batch is offered for manual clearing if present, allowing already-imported notes from a previous release to be removed after user verification. The phone does not delete anything automatically.
