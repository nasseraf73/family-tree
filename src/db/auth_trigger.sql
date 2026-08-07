-- PostgreSQL Function & Trigger for Syncing auth.users to public.users (Action Item 3)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (full_name, email, phone, role, created_at)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    new.created_at
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
