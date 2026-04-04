-- Init script: runs once when the DB container is first created
-- Creates the aip_admin user and grants all privileges

DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aip_admin') THEN
      CREATE USER aip_admin WITH SUPERUSER PASSWORD 'aip_password_123';
   END IF;
END
$$;

-- Grant full access on the database
GRANT ALL PRIVILEGES ON DATABASE aipcore_db TO aip_admin;

-- Grant schema permissions (needed for CREATE TABLE, ALTER TABLE etc.)
GRANT ALL ON SCHEMA public TO aip_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aip_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aip_admin;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aip_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aip_admin;
