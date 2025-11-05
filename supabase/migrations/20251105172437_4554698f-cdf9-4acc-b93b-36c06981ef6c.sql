-- Add industry and age_group to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS age_group TEXT;