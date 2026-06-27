  -- ============================================================
  -- SCRIPT CORRIGIDO: Criar usuários no Supabase Auth
  -- Execute no: Supabase Dashboard → SQL Editor → New Query
  -- ============================================================

  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  DO $$
  DECLARE
    now_ts TIMESTAMPTZ := now();

    -- UUIDs para os usuários (gerados na execução)
    uid_carlos    UUID;
    uid_viviane   UUID;
    uid_mellyna   UUID;
    uid_lourdes   UUID;
    uid_zecarlos  UUID;
    uid_admin     UUID;
  BEGIN

    -- ============================================================
    -- PASSO 1: Inserir usuários no auth.users (sem ON CONFLICT)
    -- ============================================================

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'carlos@laranjeiras.com') THEN
      uid_carlos := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        uid_carlos, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'carlos@laranjeiras.com', crypt('carlos123', gen_salt('bf')),
        now_ts, now_ts, now_ts, '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
      );
    ELSE
      SELECT id INTO uid_carlos FROM auth.users WHERE email = 'carlos@laranjeiras.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viviane@laranjeiras.com') THEN
      uid_viviane := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        uid_viviane, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'viviane@laranjeiras.com', crypt('viviane123', gen_salt('bf')),
        now_ts, now_ts, now_ts, '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
      );
    ELSE
      SELECT id INTO uid_viviane FROM auth.users WHERE email = 'viviane@laranjeiras.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mellyna@laranjeiras.com') THEN
      uid_mellyna := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        uid_mellyna, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'mellyna@laranjeiras.com', crypt('mellyna123', gen_salt('bf')),
        now_ts, now_ts, now_ts, '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
      );
    ELSE
      SELECT id INTO uid_mellyna FROM auth.users WHERE email = 'mellyna@laranjeiras.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lourdes@laranjeiras.com') THEN
      uid_lourdes := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        uid_lourdes, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'lourdes@laranjeiras.com', crypt('lourdes123', gen_salt('bf')),
        now_ts, now_ts, now_ts, '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
      );
    ELSE
      SELECT id INTO uid_lourdes FROM auth.users WHERE email = 'lourdes@laranjeiras.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'zecarlos@laranjeiras.com') THEN
      uid_zecarlos := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        uid_zecarlos, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'zecarlos@laranjeiras.com', crypt('zecarlos123', gen_salt('bf')),
        now_ts, now_ts, now_ts, '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
      );
    ELSE
      SELECT id INTO uid_zecarlos FROM auth.users WHERE email = 'zecarlos@laranjeiras.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@laranjeiras.com') THEN
      uid_admin := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        uid_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'admin@laranjeiras.com', crypt('admin123', gen_salt('bf')),
        now_ts, now_ts, now_ts, '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
      );
    ELSE
      SELECT id INTO uid_admin FROM auth.users WHERE email = 'admin@laranjeiras.com';
    END IF;

    -- ============================================================
    -- PASSO 2: Criar identities para login por e-mail
    -- ============================================================

    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    SELECT
      gen_random_uuid(), u.id, u.email, 'email',
      jsonb_build_object('sub', u.id::text, 'email', u.email),
      now_ts, now_ts, now_ts
    FROM auth.users u
    WHERE u.email IN (
      'carlos@laranjeiras.com', 'viviane@laranjeiras.com', 'mellyna@laranjeiras.com',
      'lourdes@laranjeiras.com', 'zecarlos@laranjeiras.com', 'admin@laranjeiras.com'
    )
    AND NOT EXISTS (
      SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
    );

    -- ============================================================
    -- PASSO 3: Vincular auth_user_id na tabela public.usuarios
    -- ============================================================

    UPDATE public.usuarios u
    SET auth_user_id = a.id
    FROM auth.users a
    WHERE a.email = (u.username || '@laranjeiras.com')
      AND u.auth_user_id IS NULL;

  END $$;

  -- ============================================================
  -- VERIFICAÇÃO FINAL
  -- ============================================================

  SELECT
    pu.username,
    pu.role,
    pu.ativo,
    pu.auth_user_id IS NOT NULL AS vinculado,
    au.email,
    (au.email_confirmed_at IS NOT NULL) AS auth_confirmado
  FROM public.usuarios pu
  LEFT JOIN auth.users au ON au.id = pu.auth_user_id
  ORDER BY pu.username;
