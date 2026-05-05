-- ── Event Rooms ────────────────────────────────────────────────────────────────
-- One room per proposal. Manages the deal-closure lifecycle from internal
-- draft through client discussion, revisions, approval, and execution.

CREATE TABLE IF NOT EXISTS event_rooms (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   uuid        NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  planner_id    uuid        NOT NULL REFERENCES auth.users(id),
  client_name   text        NOT NULL DEFAULT '',
  client_email  text,
  status        text        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','discussion','revision','approved','won','lost')),
  deal_value    numeric(14,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id)   -- one room per proposal, enforced at DB level
);

-- Planner sees and modifies only their own rooms.
ALTER TABLE event_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_rooms_planner_all"
  ON event_rooms FOR ALL
  USING  (planner_id = auth.uid())
  WITH CHECK (planner_id = auth.uid());

-- ── Discussion Comments ────────────────────────────────────────────────────────
-- Threaded, section-tagged comment thread for each room.
-- parent_id IS NULL → top-level thread; parent_id IS NOT NULL → reply.

CREATE TABLE IF NOT EXISTS event_room_comments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_room_id uuid        NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  author_id     uuid        NOT NULL REFERENCES auth.users(id),
  author_name   text        NOT NULL,
  author_type   text        NOT NULL DEFAULT 'planner'
                            CHECK (author_type IN ('planner', 'client')),
  message       text        NOT NULL CHECK (char_length(trim(message)) > 0),
  section_ref   text        CHECK (section_ref IN (
                              'concept','budget','timeline','vendors',
                              'visual','compliance','experience','activation'
                            )),
  type          text        NOT NULL DEFAULT 'comment'
                            CHECK (type IN ('comment','request_change','approval')),
  parent_id     uuid        REFERENCES event_room_comments(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_room_comments ENABLE ROW LEVEL SECURITY;
-- Planner can do everything on comments in their rooms.
CREATE POLICY "event_room_comments_planner_all"
  ON event_room_comments FOR ALL
  USING  (event_room_id IN (SELECT id FROM event_rooms WHERE planner_id = auth.uid()))
  WITH CHECK (event_room_id IN (SELECT id FROM event_rooms WHERE planner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_comments_room
  ON event_room_comments (event_room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON event_room_comments (parent_id)
  WHERE parent_id IS NOT NULL;

-- ── Proposal Versions ─────────────────────────────────────────────────────────
-- Immutable snapshots. Created automatically on each revision transition and
-- on approval. Never overwritten — new version_number every time.

CREATE TABLE IF NOT EXISTS proposal_versions (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  event_room_id  uuid    NOT NULL REFERENCES event_rooms(id) ON DELETE CASCADE,
  proposal_id    uuid    NOT NULL REFERENCES proposals(id),
  version_number int     NOT NULL,
  data_snapshot  jsonb   NOT NULL,
  label          text,
  created_by     uuid    REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_room_id, version_number)
);

ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_versions_planner_all"
  ON proposal_versions FOR ALL
  USING  (event_room_id IN (SELECT id FROM event_rooms WHERE planner_id = auth.uid()))
  WITH CHECK (event_room_id IN (SELECT id FROM event_rooms WHERE planner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_versions_room
  ON proposal_versions (event_room_id, version_number DESC);

-- ── Auto-timestamp trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_rooms_updated_at
  BEFORE UPDATE ON event_rooms
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
