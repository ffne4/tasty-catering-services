# Security Notes

## Before publishing

- Firebase web configuration values in `assets/js/firebase-config.js` are client-side configuration, not admin credentials. Keep Firestore rules and Firebase Auth enabled.
- Never commit Firebase service-account JSON files, private keys, passwords, tokens, or `.env` files.
- The old local fallback admin password has been removed. Admin access requires a Firebase Auth account.
- If a real password or private credential was previously committed anywhere, rotate it in the provider console.

## Firebase access model

- Public users can read published site content.
- Public users can create booking and testimonial documents.
- Authenticated Firebase users can manage admin content and read or delete bookings.
- Deploy `firestore.rules` after changing access rules:

```powershell
firebase deploy --only firestore:rules --project tasty-catering-3b5ce
```

## Client-side upload settings

Cloudinary unsigned upload presets and Formspree form IDs are visible to browsers by design. Restrict the Cloudinary preset to the required file types, size, and folders in Cloudinary, and configure spam protection in Formspree.
