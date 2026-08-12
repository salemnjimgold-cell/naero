-- Sprint 3 Database Sprint 1: Sample seed data for development/staging.
-- Apply after migrations 001 and 002 have been applied.
-- These places are owned by the system (null created_by for non-user-created records).
-- Run in Supabase SQL Editor or via psql.

-- ============================================================
-- SAMPLE PLACES
-- ============================================================
insert into public.places (name, description, category, subcategory, address, city, country, latitude, longitude, phone, website, tags, verified, source) values
(
  'Budapest Főváros Kormányhivatala',
  'Budapest Government Office — immigration, residency, and administrative services for foreigners.',
  'government',
  'immigration',
  'Budapest V., Városház u. 7',
  'Budapest',
  'Hungary',
  47.5055,
  19.0474,
  '+36 1 485 6900',
  'https://www.kormanyhivatal.hu',
  ARRAY['immigration', 'residency', 'government', 'permit'],
  true,
  'admin'
),
(
  'Buda International Medical Center',
  'Private international medical clinic with English-speaking doctors. General practice, pediatrics, gynecology, and dentistry.',
  'healthcare',
  'clinic',
  'Budapest XII., Határőr út 22',
  'Budapest',
  'Hungary',
  47.5167,
  19.0217,
  '+36 1 224 9100',
  'https://www.budamedical.com',
  ARRAY['medical', 'english-speaking', 'clinic', 'private'],
  true,
  'admin'
),
(
  'Magyar Posta — Nyugati Posta',
  'Main post office. Parcel services, mail, and official document handling.',
  'services',
  'postal',
  'Budapest VI., Teréz krt. 51',
  'Budapest',
  'Hungary',
  47.5112,
  19.0583,
  '+36 1 303 3540',
  'https://www.posta.hu',
  ARRAY['post', 'mail', 'parcel', 'government'],
  true,
  'admin'
),
(
  'Budapesti Metropolitan Egyetem',
  'Metropolitan University of Budapest — international programs, English-taught degrees, and student support services.',
  'education',
  'university',
  'Budapest XIV., Nagy Lajos király útja 1-9',
  'Budapest',
  'Hungary',
  47.5208,
  19.0922,
  '+36 1 308 0590',
  'https://www.metropolitan.hu',
  ARRAY['university', 'education', 'international', 'english'],
  true,
  'admin'
),
(
  'Magyar Államkincstár Ügyfélszolgálat',
  'Hungarian State Treasury — tax administration, social security, and pension services.',
  'government',
  'tax',
  'Budapest V., Nádor u. 22',
  'Budapest',
  'Hungary',
  47.5029,
  19.0479,
  '+36 1 302 2290',
  'https://www.allamkincstar.gov.hu',
  ARRAY['tax', 'social-security', 'government', 'pension'],
  true,
  'admin'
),
(
  'International Language School Budapest',
  'English and Hungarian language courses for expats and international students. All levels from A1 to C2.',
  'education',
  'language',
  'Budapest VII., Erzsébet krt. 28',
  'Budapest',
  'Hungary',
  47.5052,
  19.0651,
  '+36 30 123 4567',
  'https://www.ilsbudapest.com',
  ARRAY['language', 'hungarian', 'english', 'courses', 'expat'],
  false,
  'admin'
),
(
  'NAV Ügyfélszolgálat',
  'National Tax and Customs Administration — tax ID (adószám) registration, tax returns, and customs inquiries.',
  'government',
  'tax',
  'Budapest II., Kis Rókus u. 16/a',
  'Budapest',
  'Hungary',
  47.5119,
  19.0224,
  '+36 1 428 5000',
  'https://www.nav.gov.hu',
  ARRAY['tax', 'customs', 'government', 'registration'],
  true,
  'admin'
),
(
  'Budapest Community Center for Expats',
  'Community hub for expats, newcomers, and internationals. Events, networking, workshops, and support groups.',
  'community',
  'expat',
  'Budapest VI., Andrássy út 45',
  'Budapest',
  'Hungary',
  47.5082,
  19.0623,
  '+36 30 987 6543',
  'https://www.expatsbudapest.com',
  ARRAY['community', 'expat', 'networking', 'events', 'support'],
  false,
  'admin'
),
(
  'Lidl — Nyugati Tér',
  'Budget grocery store chain. Good for everyday shopping and affordable Hungarian/international products.',
  'shopping',
  'grocery',
  'Budapest VI., Teréz krt. 1',
  'Budapest',
  'Hungary',
  47.5101,
  19.0567,
  null,
  'https://www.lidl.hu',
  ARRAY['grocery', 'shopping', 'budget', 'supermarket'],
  false,
  'admin'
),
(
  'Tesco Express — Deák Ferenc',
  'Convenience grocery store in central Budapest. Open long hours.',
  'shopping',
  'grocery',
  'Budapest V., Deák Ferenc tér 1',
  'Budapest',
  'Hungary',
  47.4975,
  19.0544,
  null,
  'https://www.tesco.hu',
  ARRAY['grocery', 'convenience', 'shopping'],
  false,
  'admin'
),
(
  'OEP — Országos Egészségbiztosítási Pénztár',
  'National Health Insurance Fund — health insurance registration, TAJ card application, and healthcare entitlement.',
  'government',
  'healthcare',
  'Budapest V., Váci u. 36',
  'Budapest',
  'Hungary',
  47.4915,
  19.0547,
  '+36 1 350 2001',
  'https://www.neak.gov.hu',
  ARRAY['health-insurance', 'taj', 'government', 'healthcare'],
  true,
  'admin'
),
(
  'Budapest Job Center (Foglalkoztatási Szolgálat)',
  'Public employment service — job listings, career counseling, and EU registration for job seekers.',
  'services',
  'employment',
  'Budapest VIII., Kisfaludy u. 12',
  'Budapest',
  'Hungary',
  47.4978,
  19.0721,
  '+36 1 333 4400',
  'https://www.munka.hu',
  ARRAY['jobs', 'employment', 'career', 'government'],
  true,
  'admin'
);

-- ============================================================
-- SAMPLE REVIEWS (requires a real auth.uid to be meaningful;
-- these are placeholders for development testing)
-- ============================================================
-- Note: user_id values must be replaced with actual auth.users uuids
-- when applying in a real environment. These are illustrative.
-- insert into public.reviews (place_id, user_id, rating, title, content) values
--   ((select id from public.places where name = 'Buda International Medical Center'), '00000000-0000-0000-0000-000000000000', 5, 'Excellent care', 'Very professional English-speaking staff. Highly recommended.'),
--   ((select id from public.places where name = 'Budapest Community Center for Expats'), '00000000-0000-0000-0000-000000000000', 4, 'Great community hub', 'Helpful events and friendly people.'),
--   ((select id from public.places where name = 'NAV Ügyfélszolgálat'), '00000000-0000-0000-0000-000000000000', 3, 'Slow but helpful', 'Long wait times but staff eventually resolved my tax issue.');
