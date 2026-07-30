# Golden Day Club production activation

## Current build

The hosted beta is a mobile-first PWA with three end-to-end roles:

- **Admin:** users, group assignments, settings, all records, deletions in demo mode.
- **Lender:** full portfolio, groups, borrowers, loan creation, term adjustment, collection, ledger, reports.
- **Delegated manager:** assigned groups only, borrower/loan visibility, calls, collections, and scoped ledger activity.

The beta uses browser storage so the interface can be tested immediately. It must not hold real customer information.

## Production gate

A dedicated Supabase project is required. Apply `supabase/schema.sql`, create the first organization and admin profile, then replace demo login and browser storage with Supabase Auth and table operations. The schema includes row-level security that limits delegated managers to their assigned groups.

## Launch checklist

1. Create a dedicated Supabase project.
2. Apply `supabase/schema.sql`.
3. Configure email/password authentication and the first admin.
4. Add the project URL and public anon key as deployment secrets.
5. Connect frontend CRUD to Supabase tables and remove demo passwords.
6. Test role isolation, payment reversals, audit events, backups, and recovery.
7. Configure the production domain and HTTPS.
8. Review lending disclosures, fee limits, collection practices, and data-retention requirements for the operating jurisdiction.
