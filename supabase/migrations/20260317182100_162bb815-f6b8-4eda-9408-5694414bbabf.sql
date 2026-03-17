
-- Create table for saved posts
CREATE TABLE public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  tone TEXT NOT NULL,
  language_style TEXT DEFAULT '',
  language TEXT NOT NULL,
  networks TEXT[] DEFAULT '{}',
  topic TEXT NOT NULL,
  audience TEXT DEFAULT '',
  size TEXT DEFAULT '',
  image_prompt TEXT DEFAULT '',
  sources TEXT[] DEFAULT '{}',
  trends TEXT[] DEFAULT '{}',
  score_clarity NUMERIC DEFAULT 0,
  score_engagement NUMERIC DEFAULT 0,
  score_authenticity NUMERIC DEFAULT 0,
  score_provocation NUMERIC DEFAULT 0,
  score_overall NUMERIC DEFAULT 0,
  score_diagnosis TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow public access since there's no auth)
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Since there's no authentication, allow all operations publicly
CREATE POLICY "Allow public read" ON public.saved_posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.saved_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.saved_posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.saved_posts FOR DELETE USING (true);
