# Tasty Catering Service

A polished static catering website for Tasty Catering Service, Busega. The site combines a customer-facing experience with a Firebase-powered admin panel for managing services, gallery media, blog posts, testimonials, settings, and booking enquiries.

## Highlights

- Responsive public website for services, gallery, blog, testimonials, and bookings
- Firebase Firestore content management
- Firebase Authentication for admin access
- Cloudinary uploads for images and videos
- Formspree email delivery for booking enquiries
- Public testimonial submission with optional photo upload
- Background video sections and image-led catering presentation
- Firestore rules for public reads, customer submissions, and authenticated administration

## Project Structure

```text
.
├── index.html
├── about.html
├── services.html
├── gallery.html
├── blog.html
├── contact.html
├── admin.html
├── assets/
│   ├── css/style.css
│   ├── images/
│   ├── js/
│   └── videos/
├── firebase.json
├── firestore.rules
├── SECURITY.md
└── .gitignore
```

## Local Setup

This is a static HTML project. Open `index.html` with a local web server so browser modules, media, and Firebase requests behave consistently.

For example, with VS Code Live Server, open `index.html` and choose **Open with Live Server**.

The Firebase browser configuration is in `assets/js/firebase-config.js`. It identifies the Firebase project, but it is not a service-account credential. Never place service-account JSON, private keys, passwords, or tokens in the repository.

## Firebase Setup

1. Create or select the Firebase project configured in `assets/js/firebase-config.js`.
2. Enable Firestore and Firebase Authentication with Email/Password enabled.
3. Create the admin user in Firebase Authentication.
4. Deploy the rules:

```powershell
firebase login
firebase deploy --only firestore:rules --project tasty-catering-3b5ce
```

The rules allow public content reads, public booking/testimonial creation, and authenticated admin management. Review `firestore.rules` before changing the access model.

## Uploads and Email

- Cloudinary handles admin media uploads and public testimonial photos.
- Formspree receives booking enquiries through the configured booking form endpoint.
- Cloudinary unsigned upload settings and the Formspree form ID are browser-visible by design. Restrict upload presets and enable spam protection in their provider dashboards.




