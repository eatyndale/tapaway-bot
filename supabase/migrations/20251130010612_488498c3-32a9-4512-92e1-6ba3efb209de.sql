-- Add industry and age_group columns to assessments table
ALTER TABLE public.assessments 
ADD COLUMN industry text,
ADD COLUMN age_group text;

-- Add industry and age_group columns to tapping_sessions table
ALTER TABLE public.tapping_sessions 
ADD COLUMN industry text,
ADD COLUMN age_group text;