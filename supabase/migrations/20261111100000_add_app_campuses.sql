-- The app lets students pick six campuses, but only three existed in the database.
-- Add the missing ones so a student's campus can be saved to their profile.
-- Existing rows are left unchanged.
INSERT INTO public.campuses (name, short_name, city, lat, lng)
VALUES
  ('UP Cebu (Lahug)', 'UP-CEBU', 'Cebu City', 10.322600, 123.899600),
  ('University of San Carlos - Talamban', 'USC-TAL', 'Cebu City', 10.353500, 123.911500),
  ('University of San Jose-Recoletos (Basak)', 'USJ-R', 'Cebu City', 10.282300, 123.864500),
  ('Cebu Normal University', 'CNU', 'Cebu City', 10.309200, 123.893700)
ON CONFLICT (short_name) DO NOTHING;
