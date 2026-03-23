# Phase 3: WhatsApp Connection + Single Messaging

**Goal:** Connect WhatsApp via QR code and send single messages (text + media) to real numbers.

**Depends on:** Phase 2 (contacts exist to select as recipients)

---

## Deliverables

1. `SetupWhatsAppPage` — creates Evolution API instance for the user
2. `ConnectWhatsAppPage` — displays QR code, polls connection status, redirects when connected
3. `SendMessagePage` — contact dropdown, message input, media upload, send button
4. `MediaUpload` component — file selection, preview, type/size validation, Convex file storage upload
5. Convex actions (`convex/evolution.ts`): createInstance, getQrCode, checkStatus, sendText, sendMedia
6. Auth-protected `generateUploadUrl` mutation
7. `WhatsAppGuard` fully functional (redirects to /setup or /connect as needed)

## TDD Steps

### Tests First

```
tests/
├── convex/
│   ├── evolution.test.ts       # Actions call VPS API correctly (mocked HTTP)
│   └── storage.test.ts         # Upload URL generation requires auth
├── components/
│   ├── MediaUpload.test.tsx    # File selection, validation, preview, upload
│   └── WhatsAppGuard.test.tsx  # Redirects based on instanceCreated/whatsappConnected
└── pages/
    ├── SetupWhatsAppPage.test.tsx  # Creates instance, shows success/error
    ├── ConnectWhatsAppPage.test.tsx # Shows QR code, polls status, redirects when connected
    └── SendMessagePage.test.tsx    # Select contact, type message, attach media, send
```

### Implementation Order

1. Write `convex/evolution.ts` — Convex actions that call VPS worker API:
   - `createInstance` action → POST /evolution/create-instance
   - `getQrCode` action → GET /evolution/qr/:instanceName
   - `checkConnectionStatus` action → GET /evolution/status/:instanceName
   - `sendText` action → POST /evolution/send-text/:instanceName
   - `sendMedia` action → POST /evolution/send-media/:instanceName
   - `deleteInstance` action → DELETE /evolution/instance/:instanceName
2. Write auth-protected `generateUploadUrl` mutation in `convex/storage.ts`
3. Write tests for evolution actions (mock VPS HTTP calls)
4. Write `SetupWhatsAppPage` — button that calls createInstance, updates user doc
5. Write `ConnectWhatsAppPage` — displays QR image (base64), polls status every 3s, auto-redirects when `state === "open"`
6. Write `MediaUpload` component — file input, client-side validation (type + size), Convex storage upload, preview thumbnails
7. Write `SendMessagePage` — contact selector (shadcn `Select`), message textarea, MediaUpload, send button
8. Make `WhatsAppGuard` fully functional — checks user's `instanceCreated` and `whatsappConnected`
9. Write `convex/messages.ts` — mutation to log sent messages
10. Run all tests, manual verification with real WhatsApp

## Verification Criteria

- [ ] Can create an Evolution API instance (visible on VPS)
- [ ] QR code displays and refreshes
- [ ] Scanning QR code with WhatsApp connects successfully
- [ ] Connection status updates to "open" after scan
- [ ] Can send a text message to a real WhatsApp number
- [ ] Can send an image with caption
- [ ] Can send a video with caption
- [ ] Can send multiple media files in one message
- [ ] Media validation rejects files that are too large or wrong type
- [ ] Sent messages are logged in the messages table
- [ ] WhatsAppGuard correctly redirects unconnected users
- [ ] All tests pass (`vp test`)

## Notes

- The VPS worker API must be running for evolution actions to work. During development, point `EVOLUTION_API_URL` to the live VPS at `wavolution.agentifycrm.io`.
- QR codes expire after ~45-60 seconds. The ConnectWhatsAppPage should re-fetch on expiry.
- Evolution API accepts media URLs directly — no base64 conversion needed. Pass the Convex storage URL.
