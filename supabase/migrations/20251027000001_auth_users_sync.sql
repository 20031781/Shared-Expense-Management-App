/*
  # Sync Auth Users to Public Users

  Quando un utente si registra con Supabase Auth, crea automaticamente
  una entry nella tabella public.users.

  Questo è necessario perché:
  1. Supabase Auth gestisce auth.users (autenticazione)
  2. La nostra app usa public.users (dati profilo)
  3. Devono essere sincronizzati
*/

-- Funzione per creare utente in public.users quando si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger che scatta quando un nuovo utente si registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Abilita RLS su users per Supabase hosted
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: gli utenti possono leggere il proprio profilo
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.current_user_id() = id);

-- Policy: gli utenti possono aggiornare il proprio profilo
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.current_user_id() = id)
  WITH CHECK (public.current_user_id() = id);

-- Policy: solo auth trigger può inserire (tramite SECURITY DEFINER)
CREATE POLICY "Service can insert users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_id() = id);
