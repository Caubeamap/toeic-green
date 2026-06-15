-- Application writes normalize email with trim().toLowerCase().
-- Keep the invariant at the database boundary for direct or future writes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot normalize users.email because case-insensitive duplicates exist';
  END IF;
END
$$;

UPDATE users
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_canonical_check;

ALTER TABLE users
ADD CONSTRAINT users_email_canonical_check
CHECK (email = lower(btrim(email)));
