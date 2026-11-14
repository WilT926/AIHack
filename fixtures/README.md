# fixtures

Sample data for building screens without calling Claude or the database.

**Only publishable sample data goes here.** The repo is public: never put a
real thesis, a real mark scheme, lecturer notes or anything personal in this
folder. Everything here is invented.

- `home-sample.ts`: a whole sample workspace (profile, assessors, boards,
  projects, sessions) in the shapes from `src/lib/schemas`. The floor falls
  back to it when Supabase is not configured, and `npm run db:seed -- --sample`
  loads it into the database.
- `review-sample.ts`: Lane 2's sample for the review screen.
