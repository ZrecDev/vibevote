# Migrations

Name migrations `YYYYMMDDHHMMSS_short_snake_case.sql`. One Platform Lead authors migrations at a time. Never edit an applied migration; use an additive migration and document rollback or forward-repair. Pair each user-facing table/access change with RLS and negative authorization tests.
