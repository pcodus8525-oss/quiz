-- Quiz Play 스키마 (Neon Postgres)

CREATE TABLE IF NOT EXISTS questions (
  id            BIGSERIAL PRIMARY KEY,
  topic_slug    TEXT        NOT NULL,
  topic_label   TEXT        NOT NULL,
  difficulty    TEXT        NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  type          TEXT        NOT NULL CHECK (type IN ('mc4', 'ox')),
  prompt        TEXT        NOT NULL,
  choices       JSONB       NOT NULL,
  answer_index  SMALLINT    NOT NULL,
  explanation   TEXT        NOT NULL DEFAULT '',
  report_count  INTEGER     NOT NULL DEFAULT 0,
  is_hidden     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 같은 주제·난이도에서 똑같은 문제가 중복 저장되는 것을 막는다.
CREATE UNIQUE INDEX IF NOT EXISTS questions_dedup_idx
  ON questions (topic_slug, difficulty, md5(prompt));

CREATE INDEX IF NOT EXISTS questions_lookup_idx
  ON questions (topic_slug, difficulty, is_hidden);

CREATE TABLE IF NOT EXISTS games (
  id             UUID        PRIMARY KEY,
  topic_slug     TEXT        NOT NULL,
  topic_label    TEXT        NOT NULL,
  difficulty     TEXT        NOT NULL,
  question_count SMALLINT    NOT NULL,
  question_ids   JSONB       NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'done')),
  answers        JSONB,
  score          INTEGER,
  correct_count  SMALLINT,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scores (
  id             BIGSERIAL   PRIMARY KEY,
  game_id        UUID        NOT NULL UNIQUE REFERENCES games (id) ON DELETE CASCADE,
  nickname       TEXT        NOT NULL,
  topic_label    TEXT        NOT NULL,
  difficulty     TEXT        NOT NULL,
  question_count SMALLINT    NOT NULL,
  score          INTEGER     NOT NULL,
  correct_count  SMALLINT    NOT NULL,
  duration_ms    INTEGER     NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scores_rank_idx
  ON scores (difficulty, question_count, score DESC, duration_ms ASC);

CREATE TABLE IF NOT EXISTS reports (
  id          BIGSERIAL   PRIMARY KEY,
  question_id BIGINT      NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  reason      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
