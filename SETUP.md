# Setup-Anleitung

## 1. Supabase Datenbank

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Neues Projekt erstellen
3. Gehe zu **SQL Editor** und füge den Inhalt von `supabase-setup.sql` ein → Ausführen
4. Unter **Settings → API** findest du:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. E-Mail (Resend)

1. Gehe zu [resend.com](https://resend.com) und erstelle ein kostenloses Konto
2. Unter **API Keys** → neuen Key erstellen → `RESEND_API_KEY`
3. Deine Absender-Domain verifizieren (oder `onboarding@resend.dev` zum Testen nutzen)

## 3. .env.local befüllen

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=events@impactgstaad.ch
ADMIN_PASSWORD=dein-sicheres-passwort
NEXT_PUBLIC_APP_URL=https://deine-domain.vercel.app
```

## 4. Lokal testen

```bash
npm run dev
```

Öffne http://localhost:3000

## 5. Deployment auf Vercel

1. GitHub Repository erstellen und Code pushen
2. [vercel.com](https://vercel.com) → New Project → GitHub Repo auswählen
3. Environment Variables aus `.env.local` eingeben
4. Deploy

## Events verwalten

Events werden direkt in Supabase verwaltet:
- Gehe zu **Table Editor → events**
- `active = true` → dieser Event wird angezeigt
- Nur ein Event sollte gleichzeitig `active = true` haben

## Admin-Panel

Öffne `/admin` auf deiner Domain → Passwort eingeben → QR-Scanner + Gästeliste

Der QR-Scanner nutzt die Kamera des Geräts (funktioniert am besten auf dem Handy).
