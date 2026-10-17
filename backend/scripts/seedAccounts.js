import prisma from '../src/config/prisma.js'
import bcrypt from 'bcrypt'

const DEFAULT_PASSWORD = 'Password@123'

async function upsertCollege({ name, short_name, email_domain, city, state, website_url }) {
  return prisma.college.upsert({
    where: { email_domain },
    update: {
      name,
      short_name,
      city,
      state,
      website_url,
      is_active: true,
    },
    create: {
      name,
      short_name,
      email_domain,
      city,
      state,
      website_url,
      is_active: true,
    },
    select: { id: true, name: true, email_domain: true },
  })
}

async function upsertUser({
  full_name,
  email,
  college_email,
  role,
  college_id,
  is_verified = true,
  is_active = true,
  password_hash,
}) {
  return prisma.user.upsert({
    where: { email },
    update: {
      full_name,
      college_email,
      role,
      college_id,
      is_verified,
      is_active,
      password_hash,
    },
    create: {
      full_name,
      email,
      college_email,
      role,
      college_id,
      is_verified,
      is_active,
      password_hash,
    },
    select: { id: true, email: true, role: true, college_id: true },
  })
}

async function upsertOrganizerProfile({ user_id, college_id, org_name, org_type = 'club' }) {
  return prisma.organizer.upsert({
    where: { user_id },
    update: {
      college_id,
      org_name,
      org_type,
      is_active: true,
    },
    create: {
      user_id,
      college_id,
      org_name,
      org_type,
      is_active: true,
    },
    select: { id: true, user_id: true, college_id: true, org_name: true },
  })
}

async function main() {
  const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const rvce = await upsertCollege({
    name: 'R.V. College of Engineering',
    short_name: 'RVCE',
    email_domain: 'rvce.edu.in',
    city: 'Bengaluru',
    state: 'Karnataka',
    website_url: 'https://www.rvce.edu.in',
  })

  const mit = await upsertCollege({
    name: 'Model Institute of Technology',
    short_name: 'MIT-DEMO',
    email_domain: 'mitdemo.edu.in',
    city: 'Bengaluru',
    state: 'Karnataka',
    website_url: 'https://example.com',
  })

  const studentWithCollege = await upsertUser({
    full_name: 'Demo Student (RVCE)',
    email: 'student.rvce@example.com',
    college_email: 'student1@rvce.edu.in',
    role: 'student',
    college_id: rvce.id,
    password_hash,
  })

  const studentNoCollege = await upsertUser({
    full_name: 'Demo Student (No College)',
    email: 'student.nocollege@example.com',
    college_email: null,
    role: 'student',
    college_id: null,
    password_hash,
  })

  const organizerRvceUser = await upsertUser({
    full_name: 'Demo Organizer (RVCE)',
    email: 'organizer.rvce@example.com',
    college_email: 'organizer1@rvce.edu.in',
    role: 'organizer',
    college_id: rvce.id,
    password_hash,
  })

  const organizerRvce = await upsertOrganizerProfile({
    user_id: organizerRvceUser.id,
    college_id: rvce.id,
    org_name: 'RVCE Tech Club',
    org_type: 'club',
  })

  const organizerMitUser = await upsertUser({
    full_name: 'Demo Organizer (MIT)',
    email: 'organizer.mit@example.com',
    college_email: 'organizer1@mitdemo.edu.in',
    role: 'organizer',
    college_id: mit.id,
    password_hash,
  })

  const organizerMit = await upsertOrganizerProfile({
    user_id: organizerMitUser.id,
    college_id: mit.id,
    org_name: 'MIT Robotics Club',
    org_type: 'club',
  })

  console.log('Seeded colleges:', { rvce, mit })
  console.log('Seeded users:', { studentWithCollege, studentNoCollege, organizerRvceUser, organizerMitUser })
  console.log('Seeded organizer profiles:', { organizerRvce, organizerMit })
  console.log('Login password for all demo accounts:', DEFAULT_PASSWORD)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
