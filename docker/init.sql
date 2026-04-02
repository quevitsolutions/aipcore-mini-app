-- Init script: runs once when the DB container is first created
-- Creates the aip_admin user and grants privileges

DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aip_admin') THEN
      CREATE USER aip_admin WITH SUPERUSER PASSWORD 'aip_password_123';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE aipcore_db TO aip_admin;
