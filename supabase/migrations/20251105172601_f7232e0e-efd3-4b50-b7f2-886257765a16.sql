-- Update the handle_new_user function to include industry and age_group
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, email, industry, age_group)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
          NEW.email,
          NEW.raw_user_meta_data ->> 'industry',
          NEW.raw_user_meta_data ->> 'age_group');
  RETURN NEW;
END;
$function$;