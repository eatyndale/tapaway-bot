-- Add industry and age_group columns to chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN industry text,
ADD COLUMN age_group text;