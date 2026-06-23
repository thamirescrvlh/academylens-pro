
DELETE FROM public.subjects;
INSERT INTO public.subjects (name, slug, color, icon, display_order, description) VALUES
  ('Linguagens',           'linguagens',  '#A855F7', 'BookOpen',   1, 'Português, literatura e interpretação de texto.'),
  ('Matemática',           'matematica',  '#8B5CF6', 'Calculator', 2, 'Álgebra, geometria e raciocínio lógico.'),
  ('Ciências Humanas',     'humanas',     '#C8B6FF', 'Landmark',   3, 'História, geografia, filosofia e sociologia.'),
  ('Ciências da Natureza', 'natureza',    '#7C3AED', 'Atom',       4, 'Biologia, física e química.'),
  ('Redação',              'redacao',     '#9333EA', 'PenLine',    5, 'Técnicas de escrita e dissertação.'),
  ('Inglês',               'ingles',      '#B794F6', 'Languages',  6, 'Gramática, vocabulário e conversação.');
