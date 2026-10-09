-- Sample content for the home page. Safe to re-run.

insert into public.categories (slug, name, description, sort_order) values
  ('software-engineering', 'Software Engineering', 'Build web and mobile products end to end.', 1),
  ('data-analytics',       'Data & Analytics',      'Turn raw data into decisions.',               2),
  ('design',               'Product Design',        'Research, UX and interface design.',          3),
  ('digital-marketing',    'Digital Marketing',     'Grow audiences and measure what matters.',    4)
on conflict (slug) do nothing;

insert into public.courses (id, category_id, title, description, duration, level, price_cents, registration_start, image, syllabus, career_pathways, published) values
  ('full-stack-web', (select id from public.categories where slug = 'software-engineering'),
   'Full-Stack Web Development', 'Go from fundamentals to shipping production React and Node applications with a mentor-led capstone.',
   '24 weeks, part-time', 'Beginner friendly', 240000, current_date + 21,
   'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
   array['HTML, CSS and modern JavaScript','React and component architecture','Node, Express and REST APIs','PostgreSQL and authentication','Deployment and capstone project'],
   '[{"title":"Frontend Developer","description":"Build accessible, fast interfaces for product teams."},{"title":"Backend Developer","description":"Design APIs and data models that scale."},{"title":"Full-Stack Engineer","description":"Own features from database to browser."}]'::jsonb, true),
  ('data-analytics-bootcamp', (select id from public.categories where slug = 'data-analytics'),
   'Data Analytics Bootcamp', 'Learn SQL, spreadsheets, Python and dashboards while working on real business datasets.',
   '16 weeks, evenings', 'All levels', 180000, current_date + 35,
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
   array['Spreadsheet modelling','SQL for analysis','Python with pandas','Dashboards and storytelling'],
   '[{"title":"Data Analyst","description":"Answer business questions with data."},{"title":"BI Developer","description":"Own reporting and dashboards."}]'::jsonb, true),
  ('ux-ui-design', (select id from public.categories where slug = 'design'),
   'UX/UI Design Essentials', 'Learn the full design process: research, wireframes, prototypes, and usability testing.',
   '12 weeks, weekends', 'Beginner friendly', 150000, current_date + 14,
   'https://images.unsplash.com/photo-1561070791-2526d30994b8?auto=format&fit=crop&w=900&q=80',
   array['User research methods','Wireframing and prototyping','Visual design systems','Usability testing'],
   '[{"title":"UX Designer","description":"Shape products around user needs."},{"title":"UI Designer","description":"Craft consistent, beautiful interfaces."}]'::jsonb, true),
  ('growth-marketing', (select id from public.categories where slug = 'digital-marketing'),
   'Growth & Digital Marketing', 'Run paid, organic and email campaigns, and learn to measure return on every channel.',
   '10 weeks, evenings', 'All levels', 120000, current_date + 28,
   'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
   array['Channel strategy','SEO and content','Paid media','Analytics and experimentation'],
   '[{"title":"Growth Marketer","description":"Drive acquisition and retention."},{"title":"Content Strategist","description":"Plan content that converts."}]'::jsonb, true)
on conflict (id) do nothing;

insert into public.branches (id, name, mode, address, city, description, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'Downtown Campus', 'physical', '120 Market Street', 'Portland, OR', 'Our flagship campus with labs, quiet rooms and a hiring lounge.', 1),
  ('22222222-2222-2222-2222-222222222222', 'Riverside Hub',   'physical', '48 Waterfront Avenue', 'Seattle, WA', 'Evening and weekend cohorts close to transit.', 2),
  ('33333333-3333-3333-3333-333333333333', 'Live Online',     'virtual',  null, 'Anywhere', 'Live instructor-led classes with recordings and a private community.', 3)
on conflict (id) do nothing;

insert into public.course_branches (course_id, branch_id)
select c.id, b.id from public.courses c cross join public.branches b
on conflict do nothing;

insert into public.partners (name, logo_url, website, sort_order) values
  ('Northwind',  null, 'https://example.com', 1),
  ('Contoso',    null, 'https://example.com', 2),
  ('Globex',     null, 'https://example.com', 3),
  ('Initech',    null, 'https://example.com', 4),
  ('Umbrella',   null, 'https://example.com', 5),
  ('Hooli',      null, 'https://example.com', 6);

insert into public.alumni (name, course_id, role_title, company, story, photo_url, sort_order) values
  ('Amara Okafor', 'full-stack-web', 'Software Engineer', 'Northwind', 'I came from retail with no coding background. Six months after graduating I joined a product team and shipped my first feature in week two.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80', 1),
  ('Daniel Reyes', 'data-analytics-bootcamp', 'Data Analyst', 'Contoso', 'The capstone dataset became the centrepiece of my portfolio and the reason I got hired.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 2),
  ('Priya Nair', 'ux-ui-design', 'Product Designer', 'Globex', 'Critique sessions with instructors changed how I think about design. I now lead research at my company.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 3);

insert into public.testimonials (author, course_id, quote, rating) values
  ('Maya L.', 'full-stack-web', 'Small cohorts and instructors who actually review your code. I left with a portfolio and the confidence to apply.', 5),
  ('Tom R.', 'data-analytics-bootcamp', 'Practical from day one. Every lesson tied back to a question a real business would ask.', 5),
  ('Aisha K.', 'ux-ui-design', 'The weekend format let me keep my job. Supportive staff, honest feedback.', 5);

insert into public.staff (name, title, bio, photo_url, sort_order) values
  ('Dr. Helena Voss', 'Head of Curriculum', '15 years building engineering programmes and mentoring career changers.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', 1),
  ('Marcus Bell', 'Lead Instructor, Web', 'Former staff engineer. Teaches React, Node and clean architecture.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', 2),
  ('Sofia Lindqvist', 'Lead Instructor, Data', 'Analytics lead turned educator, loves SQL and teaching storytelling with data.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', 3),
  ('Kwame Mensah', 'Career Services', 'Connects graduates with hiring partners and runs interview coaching.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 4);
