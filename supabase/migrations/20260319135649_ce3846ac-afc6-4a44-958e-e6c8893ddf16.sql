
-- Create post_series table
CREATE TABLE public.post_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  tone text NOT NULL,
  language_style text NOT NULL DEFAULT '',
  language text NOT NULL,
  networks text[] NOT NULL DEFAULT '{}',
  size text NOT NULL DEFAULT 'medio',
  post_count integer NOT NULL DEFAULT 3,
  weekdays integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on post_series" ON public.post_series FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on post_series" ON public.post_series FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on post_series" ON public.post_series FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on post_series" ON public.post_series FOR DELETE TO public USING (true);

-- Create calendar_posts table
CREATE TABLE public.calendar_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  series_id uuid REFERENCES public.post_series(id) ON DELETE SET NULL,
  series_order integer,
  topic text NOT NULL,
  tone text NOT NULL,
  language_style text NOT NULL DEFAULT '',
  language text NOT NULL,
  networks text[] NOT NULL DEFAULT '{}',
  size text NOT NULL DEFAULT '',
  content text,
  hashtags text[] DEFAULT '{}',
  image_prompt text DEFAULT '',
  score_clarity numeric DEFAULT 0,
  score_engagement numeric DEFAULT 0,
  score_authenticity numeric DEFAULT 0,
  score_provocation numeric DEFAULT 0,
  score_overall numeric DEFAULT 0,
  score_diagnosis text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on calendar_posts" ON public.calendar_posts FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on calendar_posts" ON public.calendar_posts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on calendar_posts" ON public.calendar_posts FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on calendar_posts" ON public.calendar_posts FOR DELETE TO public USING (true);
