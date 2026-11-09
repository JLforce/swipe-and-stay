
-- Swipe & Stay development seed data.
-- Demo listings are NOT real rental offers.
-- Campus coordinates are approximate; verify before production use.

BEGIN;

-- 1. Seed campuses. Re-running this section won't duplicate short names.
INSERT INTO public.campuses (name, short_name, city, lat, lng)
VALUES
  ('Cebu Institute of Technology - University', 'CIT-U',
   'Cebu City', 10.315700, 123.891000),
  ('University of San Carlos - Downtown Campus', 'USC-DT',
   'Cebu City', 10.295800, 123.898700),
  ('University of Cebu - Main Campus', 'UC-MAIN',
   'Cebu City', 10.296300, 123.901000)
ON CONFLICT (short_name) DO NOTHING;

-- 2. Seed ten unmistakably labeled demo listings.
-- Fixed UUIDs and title checks help prevent duplicates on reruns.
INSERT INTO public.listings (
  id, title, description, price, type, occupancy,
  address, lat, lng, amenities, photo_urls, is_active
)
SELECT
  v.id, v.title, v.description, v.price, v.type, v.occupancy,
  v.address, v.lat, v.lng, v.amenities, ARRAY[]::text[], false
FROM (
  VALUES
  ('10000000-0000-4000-8000-000000000001'::uuid,
   '[DEMO ONLY] Dorm listing 01',
   'Test record only. Not a real rental property.',
   3500::numeric, 'dorm', 'shared',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Wi-Fi', 'Study area']::text[]),

  ('10000000-0000-4000-8000-000000000002'::uuid,
   '[DEMO ONLY] Boarding house listing 02',
   'Test record only. Not a real rental property.',
   4500::numeric, 'boarding_house', 'shared',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Wi-Fi', 'Laundry']::text[]),

  ('10000000-0000-4000-8000-000000000003'::uuid,
   '[DEMO ONLY] Apartment listing 03',
   'Test record only. Not a real rental property.',
   7000::numeric, 'apartment', 'solo',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Kitchen', 'Wi-Fi']::text[]),

  ('10000000-0000-4000-8000-000000000004'::uuid,
   '[DEMO ONLY] Condo listing 04',
   'Test record only. Not a real rental property.',
   12000::numeric, 'condo', 'solo',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Security', 'Elevator']::text[]),

  ('10000000-0000-4000-8000-000000000005'::uuid,
   '[DEMO ONLY] Dorm listing 05',
   'Test record only. Not a real rental property.',
   4000::numeric, 'dorm', 'shared',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Study area', 'Laundry']::text[]),

  ('10000000-0000-4000-8000-000000000006'::uuid,
   '[DEMO ONLY] Boarding house listing 06',
   'Test record only. Not a real rental property.',
   5000::numeric, 'boarding_house', 'solo',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Wi-Fi']::text[]),

  ('10000000-0000-4000-8000-000000000007'::uuid,
   '[DEMO ONLY] Apartment listing 07',
   'Test record only. Not a real rental property.',
   8500::numeric, 'apartment', 'shared',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Kitchen', 'Laundry']::text[]),

  ('10000000-0000-4000-8000-000000000008'::uuid,
   '[DEMO ONLY] Condo listing 08',
   'Test record only. Not a real rental property.',
   15000::numeric, 'condo', 'solo',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Security', 'Wi-Fi']::text[]),

  ('10000000-0000-4000-8000-000000000009'::uuid,
   '[DEMO ONLY] Dorm listing 09',
   'Test record only. Not a real rental property.',
   3000::numeric, 'dorm', 'shared',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Study area']::text[]),

  ('10000000-0000-4000-8000-000000000010'::uuid,
   '[DEMO ONLY] Boarding house listing 10',
   'Test record only. Not a real rental property.',
   5500::numeric, 'boarding_house', 'shared',
   'DEMO ADDRESS - replace with verified address',
   10.315700::numeric, 123.891000::numeric,
   ARRAY['Wi-Fi', 'Kitchen']::text[])
) AS v(
  id, title, description, price, type, occupancy,
  address, lat, lng, amenities
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.listings AS existing
  WHERE existing.title = v.title
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
