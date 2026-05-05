-- Add floor_plan column to event_rooms.
-- Missing from the initial migration; its absence caused the public
-- room API to return 404 (PostgREST errors on unknown columns are
-- treated as empty results by the error-or-null guard in the route).
ALTER TABLE event_rooms ADD COLUMN IF NOT EXISTS floor_plan jsonb;
