// Convert snake_case DB rows to the camelCase shape the client consumes.
export function mapCourse(row) {
  if (!row) return row
  const { category, course_branches: courseBranches, ...rest } = row
  return {
    id: rest.id,
    title: rest.title,
    description: rest.description,
    duration: rest.duration,
    level: rest.level,
    priceCents: rest.price_cents,
    currency: rest.currency,
    registrationStart: rest.registration_start,
    image: rest.image,
    syllabus: rest.syllabus ?? [],
    careerPathways: rest.career_pathways ?? [],
    published: rest.published,
    categoryId: rest.category_id,
    category: category ? { id: category.id, slug: category.slug, name: category.name } : null,
    branches: (courseBranches ?? []).map((entry) => entry.branch).filter(Boolean),
  }
}

// camelCase request body -> DB columns for courses.
export function courseToRow(input) {
  const map = {
    id: 'id', title: 'title', description: 'description', duration: 'duration', level: 'level',
    priceCents: 'price_cents', currency: 'currency', registrationStart: 'registration_start',
    image: 'image', syllabus: 'syllabus', careerPathways: 'career_pathways', published: 'published',
    categoryId: 'category_id',
  }
  const row = {}
  for (const [key, column] of Object.entries(map)) if (input[key] !== undefined) row[column] = input[key]
  if (row.image === '') row.image = null
  if (row.registration_start === '') row.registration_start = null
  return row
}

export function mapOrder(row) {
  if (!row) return row
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    course: row.course ? { id: row.course.id, title: row.course.title } : undefined,
    branchId: row.branch_id,
    studentName: row.student_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    subtotalCents: row.subtotal_cents,
    feeCents: row.fee_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    createdAt: row.created_at,
  }
}
