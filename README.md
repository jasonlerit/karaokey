# Karaokey

![Spec-driven](https://img.shields.io/badge/development-spec--driven-2563eb)
![Vibe coded](https://img.shields.io/badge/built%20with-vibe%20coding-8b5cf6)
![Human code: none](https://img.shields.io/badge/human%20code-none-f97316)

An anonymous, browser-based karaoke queue for in-person gatherings.

Hosts create a room on a TV, while guests scan a QR code to join, search YouTube, and add songs from their phones—no accounts required.

## Features

- QR code room joining
- YouTube karaoke search and playback
- Real-time shared queue
- Host playback and moderation controls
- Mobile-friendly guest experience
- Temporary, privacy-conscious sessions

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and configure the required values.

3. Run database migrations:

   ```sh
   npm run db:migrate
   ```

4. Start the development server:

   ```sh
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```sh
npm run check
npm test
npm run build
```

## Status

Karaokey is currently a personal project and is not yet production-ready.
