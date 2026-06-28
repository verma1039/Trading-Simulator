-- Phase 4A.2 signup/profile unification.
-- No schema change is required. This data pass marks existing profiles complete
-- only when all required signup-era profile fields already exist.

update public.profiles
set profile_completed = true
where profile_completed = false
  and nullif(btrim(display_name), '') is not null
  and nullif(btrim(email), '') is not null
  and phone_number is not null
  and phone_number ~ '^[0-9]{10,15}$'
  and date_of_birth is not null;
