
-- Required Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM REPLACEMENT TABLES
CREATE TABLE account_tier (
    tier TEXT PRIMARY KEY
);

INSERT INTO account_tier (tier) VALUES 
('free'), ('premium'), ('teacher'), ('admin'), ('tester');

CREATE TABLE language_level (
    code TEXT PRIMARY KEY,
    description TEXT
);

INSERT INTO language_level (code, description) VALUES
('A1', 'Beginner'),
('A2', 'Elementary'),
('B1', 'Intermediate'),
('B2', 'Upper Intermediate'),
('C1', 'Advanced'),
('C2', 'Proficient');

CREATE TABLE language_codes (
    code TEXT PRIMARY KEY,
    english_name TEXT NOT NULL,
    native_name TEXT,
    direction TEXT DEFAULT 'LTR'
);

INSERT INTO language_codes (code, english_name, native_name, direction) VALUES
('en', 'English', 'English', 'LTR'),
('fr', 'French', 'Français', 'LTR'),
('de', 'German', 'Deutsch', 'LTR'),
('ar', 'Arabic', 'العربية', 'RTL'),
('ru', 'Russian', 'Русский', 'LTR'),
('cz', 'Czech', 'Čeština', 'LTR');

-- PARTS OF SPEECH LOOKUP
CREATE TABLE part_of_speech (
    pos_code TEXT PRIMARY KEY,
    label TEXT
);

INSERT INTO part_of_speech (pos_code, label) VALUES
('noun', 'Noun'),
('verb', 'Verb'),
('adj', 'Adjective'),
('adv', 'Adverb'),
('prep', 'Preposition'),
('none', 'None');

-- APP USER TABLE
CREATE TABLE app_user (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email_hash TEXT,
    password_hash TEXT,
    jwt_refresh_token_hash TEXT,
    account_tier TEXT REFERENCES account_tier(tier),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    last_login TIMESTAMP
);

-- VOCABULARY SET TABLE
CREATE TABLE vocabulary_set (
    set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    language_from TEXT REFERENCES language_codes(code),
    language_to TEXT REFERENCES language_codes(code),
    level TEXT REFERENCES language_level(code),
    owner_id UUID REFERENCES app_user(user_id) ON DELETE SET NULL,
    last_changed_by_id UUID REFERENCES app_user(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- COLLECTION TABLE
CREATE TABLE collection (
    collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    owner_id UUID REFERENCES app_user(user_id) ON DELETE SET NULL
);

-- GRAMMAR CONCEPT TABLE
CREATE TABLE grammar_concept (
    concept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    level TEXT REFERENCES language_level(code),
    created_at TIMESTAMP DEFAULT now()
);

-- VOCABULARY TABLE
CREATE TABLE vocabulary (
    vocab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    part_of_speech TEXT REFERENCES part_of_speech(pos_code),
    grammar_concept_id UUID REFERENCES grammar_concept(concept_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- VOCAB PROGRESS TABLE
CREATE TABLE vocab_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_user(user_id) ON DELETE CASCADE,
    vocab_id UUID REFERENCES vocabulary(vocab_id) ON DELETE CASCADE,
    set_id UUID REFERENCES vocabulary_set(set_id) ON DELETE CASCADE,
    score FLOAT DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
    correct_streak INT DEFAULT 0 CHECK (correct_streak >= 0),
    last_seen_at TIMESTAMP DEFAULT now(),
    priority_weight FLOAT DEFAULT 1.0,
    mastery_level FLOAT DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 1)
);

-- ASSOCIATION TABLES
CREATE TABLE vocab_set_association (
    vocab_id UUID REFERENCES vocabulary(vocab_id) ON DELETE CASCADE,
    set_id UUID REFERENCES vocabulary_set(set_id) ON DELETE CASCADE,
    position INT,
    PRIMARY KEY (vocab_id, set_id),
    UNIQUE (set_id, position)
);

CREATE TABLE collection_set_association (
    collection_id UUID REFERENCES collection(collection_id) ON DELETE CASCADE,
    set_id UUID REFERENCES vocabulary_set(set_id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, set_id)
);

CREATE TABLE vocabulary_set_collaborators (
    set_id UUID REFERENCES vocabulary_set(set_id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_user(user_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'editor',
    PRIMARY KEY (set_id, user_id)
);

CREATE TABLE collection_collaborators (
    collection_id UUID REFERENCES collection(collection_id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_user(user_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'editor',
    PRIMARY KEY (collection_id, user_id)
);

-- AUDIT LOG TABLE
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT,
    entity_id UUID,
    action TEXT,
    user_id UUID REFERENCES app_user(user_id),
    payload JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- MATERIALIZED VIEW EXAMPLE (optional, must be refreshed manually)
-- CREATE MATERIALIZED VIEW user_vocab_stats AS
-- SELECT
--     user_id,
--     COUNT(*) AS total_vocab,
--     AVG(mastery_level) AS avg_mastery
-- FROM vocab_progress
-- GROUP BY user_id;
