-- Seed default demo user for instant login and hackathon evaluation
INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
VALUES (
    'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3',
    'Alex Vance',
    'alex@example.com',
    '$2b$10$fyB745UJN4tIXEiLEZOuSeU86tfrLyKSy32isJYZEkIEy/EHzAIsq',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
