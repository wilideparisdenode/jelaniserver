import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Demo seed for the Jelani Consulting LMS. Idempotent: safe to re-run.
// Usage: node scripts/seed.js

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const ADMIN_EMAIL = 'mgm@jelani.consulting'
const ADMIN_PASSWORD = 'ChandeJac20720'
const STUDENT_EMAIL = 'student@jelani.consulting'
const STUDENT_PASSWORD = 'StudentDemo1!'

const today = new Date()
const plusDays = (days) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10)

async function requireTables(table) {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (error) throw new Error(`Table "${table}" is not available (${error.message}). Run supabase/migrations/001, 002 and 003 first.`)
}

async function seedCategories() {
  const rows = [
    { slug: 'software-engineering', name: 'Software Engineering', description: 'Build web and mobile products end to end.', sort_order: 1 },
    { slug: 'data-analytics', name: 'Data & Analytics', description: 'Turn raw data into decisions.', sort_order: 2 },
    { slug: 'design', name: 'Product Design', description: 'Research, UX and interface design.', sort_order: 3 },
    { slug: 'digital-marketing', name: 'Digital Marketing', description: 'Grow audiences and measure what matters.', sort_order: 4 },
    { slug: 'career-skills', name: 'Career Skills (Free)', description: 'Free starter courses to get you moving.', sort_order: 5 },
  ]
  const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'slug' })
  if (error) throw new Error(`categories: ${error.message}`)
  const { data } = await supabase.from('categories').select('id, slug')
  console.log(`seeded categories (${rows.length})`)
  return Object.fromEntries(data.map((row) => [row.slug, row.id]))
}

function courseRows(cat) {
  return [
    {
      id: 'full-stack-web', category_id: cat['software-engineering'], title: 'Full-Stack Web Development',
      description: 'Go from fundamentals to shipping production React and Node applications with a mentor-led capstone.',
      duration: '24 weeks, part-time', level: 'Beginner friendly', price_cents: 240000, currency: 'usd', registration_start: plusDays(21),
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
      syllabus: ['HTML, CSS and modern JavaScript', 'React and component architecture', 'Node, Express and REST APIs', 'PostgreSQL and authentication', 'Deployment and capstone project'],
      career_pathways: [{ title: 'Frontend Developer', description: 'Build accessible, fast interfaces for product teams.' }, { title: 'Backend Developer', description: 'Design APIs and data models that scale.' }, { title: 'Full-Stack Engineer', description: 'Own features from database to browser.' }],
      published: true,
    },
    {
      id: 'cloud-devops', category_id: cat['software-engineering'], title: 'Cloud & DevOps Engineering',
      description: 'Learn Linux, Docker, CI/CD and AWS fundamentals while deploying real services to the cloud.',
      duration: '18 weeks, evenings', level: 'Intermediate', price_cents: 210000, currency: 'usd', registration_start: plusDays(30),
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
      syllabus: ['Linux and the command line', 'Containers with Docker', 'CI/CD pipelines', 'Cloud infrastructure on AWS', 'Monitoring and reliability'],
      career_pathways: [{ title: 'DevOps Engineer', description: 'Automate build, test and deploy pipelines.' }, { title: 'Cloud Engineer', description: 'Run reliable infrastructure in the cloud.' }],
      published: true,
    },
    {
      id: 'data-analytics-bootcamp', category_id: cat['data-analytics'], title: 'Data Analytics Bootcamp',
      description: 'Learn SQL, spreadsheets, Python and dashboards while working on real business datasets.',
      duration: '16 weeks, evenings', level: 'All levels', price_cents: 180000, currency: 'usd', registration_start: plusDays(35),
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
      syllabus: ['Spreadsheet modelling', 'SQL for analysis', 'Python with pandas', 'Dashboards and storytelling'],
      career_pathways: [{ title: 'Data Analyst', description: 'Answer business questions with data.' }, { title: 'BI Developer', description: 'Own reporting and dashboards.' }],
      published: true,
    },
    {
      id: 'ux-ui-design', category_id: cat.design, title: 'UX/UI Design Essentials',
      description: 'Learn the full design process: research, wireframes, prototypes, and usability testing.',
      duration: '12 weeks, weekends', level: 'Beginner friendly', price_cents: 150000, currency: 'usd', registration_start: plusDays(14),
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b8?auto=format&fit=crop&w=900&q=80',
      syllabus: ['User research methods', 'Wireframing and prototyping', 'Visual design systems', 'Usability testing'],
      career_pathways: [{ title: 'UX Designer', description: 'Shape products around user needs.' }, { title: 'UI Designer', description: 'Craft consistent, beautiful interfaces.' }],
      published: true,
    },
    {
      id: 'growth-marketing', category_id: cat['digital-marketing'], title: 'Growth & Digital Marketing',
      description: 'Run paid, organic and email campaigns, and learn to measure return on every channel.',
      duration: '10 weeks, evenings', level: 'All levels', price_cents: 120000, currency: 'usd', registration_start: plusDays(28),
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
      syllabus: ['Channel strategy', 'SEO and content', 'Paid media', 'Analytics and experimentation'],
      career_pathways: [{ title: 'Growth Marketer', description: 'Drive acquisition and retention.' }, { title: 'Content Strategist', description: 'Plan content that converts.' }],
      published: true,
    },
    {
      id: 'intro-digital-skills', category_id: cat['career-skills'], title: 'Introduction to Digital Skills (Free)',
      description: 'A free, self-paced introduction to computers, the web and productivity tools — perfect as a first step.',
      duration: '4 weeks, self-paced', level: 'Beginner friendly', price_cents: 0, currency: 'usd', registration_start: plusDays(7),
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
      syllabus: ['Using a computer with confidence', 'Browsing and staying safe online', 'Documents and spreadsheets', 'Email and collaboration tools'],
      career_pathways: [{ title: 'Ready for further study', description: 'A foundation for our paid career programmes.' }],
      published: true,
    },
  ]
}

async function seedCourses(cat) {
  const rows = courseRows(cat)
  for (const row of rows) {
    const { error } = await supabase.from('courses').upsert(row, { onConflict: 'id' })
    if (error) console.warn(`course ${row.id} skipped: ${error.message}`)
  }
  console.log(`seeded courses (${rows.length}, 1 free)`)

  const { data: branches } = await supabase.from('branches').select('id')
  const { data: courses } = await supabase.from('courses').select('id')
  const links = []
  for (const course of courses) for (const branch of branches) links.push({ course_id: course.id, branch_id: branch.id })
  const { error: linkErr } = await supabase.from('course_branches').upsert(links, { onConflict: 'course_id,branch_id' })
  if (linkErr) console.warn(`course_branches skipped: ${linkErr.message}`)
}

async function seedBranches() {
  const rows = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Downtown Campus', mode: 'physical', address: '120 Market Street', city: 'Portland, OR', description: 'Our flagship campus with labs, quiet rooms and a hiring lounge.', sort_order: 1 },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Riverside Hub', mode: 'physical', address: '48 Waterfront Avenue', city: 'Seattle, WA', description: 'Evening and weekend cohorts close to transit.', sort_order: 2 },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Live Online', mode: 'virtual', address: null, city: 'Anywhere', description: 'Live instructor-led classes with recordings and a private community.', sort_order: 3 },
  ]
  const { error } = await supabase.from('branches').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`branches: ${error.message}`)
  console.log(`seeded branches (${rows.length})`)
}

async function seedIfEmpty(table, rows) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`${table}: ${error.message}`)
  if (count && count > 0) { console.log(`skip ${table} (${count} rows)`); return }
  const { error: insertError } = await supabase.from(table).insert(rows)
  if (insertError) throw new Error(`${table}: ${insertError.message}`)
  console.log(`seeded ${table} (${rows.length})`)
}

async function ensureUser(email, password, fullName, role) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw new Error(`auth.listUsers: ${listError.message}`)
  let user = list.users.find((candidate) => candidate.email === email)
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
    if (error) throw new Error(`createUser ${email}: ${error.message}`)
    user = data.user
    console.log(`created user ${email}`)
  } else {
    await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { full_name: fullName } })
    console.log(`updated user ${email}`)
  }
  const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, role }, { onConflict: 'id' })
  if (profileError) console.warn(`profile ${email} skipped: ${profileError.message}`)
  return user.id
}

async function seedPosts(adminId) {
  const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true })
  if (count && count > 0) { console.log(`skip posts (${count} rows)`); return }
  const rows = [
    { title: 'Free introductory courses are now live', excerpt: 'Start learning at no cost with our new self-paced digital skills course.', body: 'We believe the first step should never cost anything.\n\nOur new Introduction to Digital Skills course is free, self-paced, and designed for complete beginners. Enrol in seconds from the course page — no payment required — and upgrade to a paid career programme whenever you are ready.', cover_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', author_name: 'Jelani Consulting', published: true, created_by: adminId },
    { title: 'New evening cohorts at the Riverside Hub', excerpt: 'More evening and weekend dates added for working professionals.', body: 'Due to demand, we have added evening and weekend cohorts at our Riverside Hub.\n\nSeats are limited and allocated on a first-come basis once payment is confirmed. Browse the course catalog, choose your registration start date, and secure your place.', cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', author_name: 'Jelani Consulting', published: true, created_by: adminId },
    { title: 'Meet our hiring partners', excerpt: 'Graduates are being hired across technology, data and design.', body: 'Our career services team works with hiring partners who interview our graduates directly.\n\nEvery programme ends with a portfolio capstone that employers recognise. Read alumni stories on the home page to see where graduates land.', cover_image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', author_name: 'Jelani Consulting', published: true, created_by: adminId },
  ]
  const { error } = await supabase.from('posts').insert(rows)
  if (error) throw new Error(`posts: ${error.message}`)
  console.log(`seeded posts (${rows.length})`)
}

async function seedComments(studentId) {
  const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true })
  if (count && count > 0) { console.log(`skip comments (${count} rows)`); return }
  const { data: posts } = await supabase.from('posts').select('id').order('created_at', { ascending: true })
  if (!posts?.length) return
  const rows = [
    { post_id: posts[0].id, user_id: studentId, author: 'Demo Student', body: 'The free course was a great way to start — signing up was instant.', approved: true },
    { post_id: posts[0].id, user_id: studentId, author: 'Demo Student', body: 'Is there a certificate at the end of this course?', approved: false },
  ]
  const { error } = await supabase.from('comments').insert(rows)
  if (error) throw new Error(`comments: ${error.message}`)
  console.log(`seeded comments (${rows.length}: 1 approved, 1 pending)`)
}

async function main() {
  console.log('Seeding Jelani Consulting demo data…')
  await requireTables('courses')
  await seedBranches()
  const cat = await seedCategories()
  await seedCourses(cat)

  await seedIfEmpty('partners', [
    { name: 'Northwind', logo_url: null, website: 'https://example.com', sort_order: 1 },
    { name: 'Contoso', logo_url: null, website: 'https://example.com', sort_order: 2 },
    { name: 'Globex', logo_url: null, website: 'https://example.com', sort_order: 3 },
    { name: 'Initech', logo_url: null, website: 'https://example.com', sort_order: 4 },
    { name: 'Umbrella', logo_url: null, website: 'https://example.com', sort_order: 5 },
    { name: 'Hooli', logo_url: null, website: 'https://example.com', sort_order: 6 },
  ])
  await seedIfEmpty('alumni', [
    { name: 'Amara Okafor', course_id: 'full-stack-web', role_title: 'Software Engineer', company: 'Northwind', story: 'I came from retail with no coding background. Six months after graduating I joined a product team and shipped my first feature in week two.', photo_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80', sort_order: 1 },
    { name: 'Daniel Reyes', course_id: 'data-analytics-bootcamp', role_title: 'Data Analyst', company: 'Contoso', story: 'The capstone dataset became the centrepiece of my portfolio and the reason I got hired.', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', sort_order: 2 },
    { name: 'Priya Nair', course_id: 'ux-ui-design', role_title: 'Product Designer', company: 'Globex', story: 'Critique sessions with instructors changed how I think about design. I now lead research at my company.', photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', sort_order: 3 },
  ])
  await seedIfEmpty('testimonials', [
    { author: 'Maya L.', course_id: 'full-stack-web', quote: 'Small cohorts and instructors who actually review your code. I left with a portfolio and the confidence to apply.', rating: 5 },
    { author: 'Tom R.', course_id: 'data-analytics-bootcamp', quote: 'Practical from day one. Every lesson tied back to a question a real business would ask.', rating: 5 },
    { author: 'Aisha K.', course_id: 'ux-ui-design', quote: 'The weekend format let me keep my job. Supportive staff, honest feedback.', rating: 5 },
  ])
  await seedIfEmpty('staff', [
    { name: 'Dr. Helena Voss', title: 'Head of Curriculum', bio: '15 years building engineering programmes and mentoring career changers.', photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', sort_order: 1 },
    { name: 'Marcus Bell', title: 'Lead Instructor, Web', bio: 'Former staff engineer. Teaches React, Node and clean architecture.', photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', sort_order: 2 },
    { name: 'Sofia Lindqvist', title: 'Lead Instructor, Data', bio: 'Analytics lead turned educator, loves SQL and teaching storytelling with data.', photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', sort_order: 3 },
    { name: 'Kwame Mensah', title: 'Career Services', bio: 'Connects graduates with hiring partners and runs interview coaching.', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', sort_order: 4 },
  ])

  const adminId = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'mgm', 'admin')
  const studentId = await ensureUser(STUDENT_EMAIL, STUDENT_PASSWORD, 'Demo Student', 'student')

  try {
    await requireTables('posts')
    await seedPosts(adminId)
    await seedComments(studentId)
  } catch (error) {
    console.warn(error.message)
  }

  console.log('\nDone.')
  console.log(`Admin login:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  console.log(`Student login: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`)
}

main().catch((error) => { console.error('\nSeed failed:', error.message); process.exit(1) })
