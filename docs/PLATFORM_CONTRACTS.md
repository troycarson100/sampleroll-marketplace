# Platform dashboard & creator contracts

## Access

| Role | How | Can do |
|------|-----|--------|
| **Owner** | Email listed in `PLATFORM_OWNER_EMAILS` (comma-separated, case-insensitive) | Everything, including **Supervisors** |
| **Supervisor** | Row in `platform_staff` (added by an owner) | Create/send contracts, view `/platform` |
| **Creator** | Receives link `/creator-contract/{token}` | Review PDF, accept or decline |

Set in `.env.local`:

```env
PLATFORM_OWNER_EMAILS="troy@sampleroll.com"
```

## Database & storage

Apply migration (loads `DATABASE_URL` from `.env.local`; avoids needing `dotenv-cli` on PATH):

```bash
npm run db:run-sql -- supabase/migrations/20260322180000_platform_contracts.sql
npx prisma generate
```

Alternatively: paste the full SQL file contents into **Supabase → SQL Editor** and run.

Schema in Prisma already includes `PlatformStaff` and `CreatorContract`.

Private bucket **`contract-legal`** holds PDFs; uploads use the **service role** (same as other creator uploads).

## Flow

1. **Owner or supervisor** → `/platform/contracts/new`  
2. Enter **registered** creator email, **creator revenue share %** (0–100), optional title/notes.  
3. Upload **PDF** agreement.  
4. **Send** — sets status to `PENDING_REVIEW`. If `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set, Resend emails the creator; otherwise copy the **review link** from the response / UI.  
5. Creator opens link, downloads PDF, **Accept** or **Decline**.  
6. **Accept** → contract `ACTIVE`, previous `ACTIVE` contracts for that creator → `VOID`, `profiles_marketplace.custom_split_percentage` updated (drives Stripe Connect fee + earnings webhook).

## Optional email (Resend)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="SampleRoll <contracts@yourdomain.com>"
```

Verify your domain in Resend. Without this, sharing the acceptance URL manually is fine.

## URLs

| Path | Purpose |
|------|---------|
| `/platform` | Admin home |
| `/platform/contracts` | List |
| `/platform/contracts/new` | Wizard |
| `/platform/staff` | Owners only — manage supervisors |
| `/creator-contract/{token}` | Creator review (login required, must match invited user) |

## Security notes

- Contract **token** is unguessable (32-byte hex); treat links like secrets.  
- Legal download checks session + creator identity + contract status.  
- Supervisors **cannot** add other supervisors (owner-only API).
