import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Yenepoya School of Engineering & Technology (Balmatta, Mangalore) campus data...');

  // 1. Clean existing records
  await prisma.chatMessage.deleteMany({});
  await prisma.claim.deleteMany({});
  await prisma.matchNotification.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Yenepoya Campus Members (.edu.in)
  const rohan = await prisma.user.create({
    data: {
      email: 'rohan.shetty@yenepoya.edu.in',
      name: 'Rohan Shetty',
      campusName: 'Yenepoya School of Engg & Tech, Balmatta',
      role: 'STUDENT',
    },
  });

  const ananya = await prisma.user.create({
    data: {
      email: 'ananya.rai@yenepoya.edu.in',
      name: 'Ananya Rai',
      campusName: 'Yenepoya School of Engg & Tech, Balmatta',
      role: 'STUDENT',
    },
  });

  const faculty = await prisma.user.create({
    data: {
      email: 'praveen.kumar@yenepoya.edu.in',
      name: 'Dr. Praveen Kumar',
      campusName: 'Yenepoya School of Engg & Tech, Balmatta',
      role: 'STAFF',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'security.balmatta@yenepoya.edu.in',
      name: 'Balmatta Campus Security Dispatch',
      campusName: 'Yenepoya Balmatta Campus Office',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Created 4 Yenepoya campus accounts with verified .edu.in domains.`);

  // 3. Create Realistic Incidents pinned across Yenepoya School of Engineering & Balmatta, Mangalore
  const items = [
    {
      type: 'LOST',
      title: 'HP Pavilion Laptop (Silver, 15-inch) with Coding Stickers',
      description: 'Left on the 2nd-floor study desk in the YSET Central Library. Has React & Python stickers on the lid and a black neoprene sleeve.',
      category: 'ELECTRONICS',
      locationName: 'YSET Central Library, 2nd Floor Study Area',
      latitude: 12.8708,
      longitude: 74.8455,
      dateLostOrFound: new Date(Date.now() - 2 * 60 * 60 * 1000),
      contactEmail: 'rohan.shetty@yenepoya.edu.in',
      secretQuestion: 'What stickers are on the keyboard palm rest or what is the desktop wallpaper?',
      userId: rohan.id,
      status: 'OPEN',
    },
    {
      type: 'FOUND',
      title: 'HP Laptop with Stickers found in Library',
      description: 'Found unattended laptop on table near reference section in Central Library. Handed over to circulation desk staff.',
      category: 'ELECTRONICS',
      locationName: 'Central Library Circulation Desk, Balmatta',
      latitude: 12.8709,
      longitude: 74.8456,
      dateLostOrFound: new Date(Date.now() - 1 * 60 * 60 * 1000),
      contactEmail: 'ananya.rai@yenepoya.edu.in',
      secretQuestion: 'State the specific developer stickers on the top lid.',
      userId: ananya.id,
      status: 'OPEN',
    },
    {
      type: 'LOST',
      title: 'OnePlus Buds Pro 2 (Matte Black Charging Case)',
      description: 'Misplaced in the seating lounge near the Student Cafeteria & Food Court during lunch break.',
      category: 'ELECTRONICS',
      locationName: 'Student Cafeteria & Food Court, Balmatta',
      latitude: 12.8722,
      longitude: 74.8485,
      dateLostOrFound: new Date(Date.now() - 4 * 60 * 60 * 1000),
      contactEmail: 'rohan.shetty@yenepoya.edu.in',
      secretQuestion: 'What color is the silicone protective case over the box?',
      userId: rohan.id,
      status: 'OPEN',
    },
    {
      type: 'FOUND',
      title: 'Yenepoya University Student ID Card & Key Ring (CSE Dept)',
      description: 'Found near the Balmatta Junction Walkway gate entrance. Turned in to security office.',
      category: 'KEYS_CARDS',
      locationName: 'Balmatta Junction Walkway & Gate',
      latitude: 12.8689,
      longitude: 74.8450,
      dateLostOrFound: new Date(Date.now() - 8 * 60 * 60 * 1000),
      contactEmail: 'security.balmatta@yenepoya.edu.in',
      secretQuestion: 'Confirm the student registration number ending 3 digits.',
      userId: admin.id,
      status: 'OPEN',
    },
    {
      type: 'LOST',
      title: 'Black Wildcraft College Backpack (Contains Engineering Notebooks)',
      description: 'Accidentally left beside bench in YSET Academic Block corridor near Room 204.',
      category: 'BAGS',
      locationName: 'YSET Engineering Academic Block, 2nd Floor',
      latitude: 12.8715,
      longitude: 74.8478,
      dateLostOrFound: new Date(Date.now() - 18 * 60 * 60 * 1000),
      contactEmail: 'ananya.rai@yenepoya.edu.in',
      secretQuestion: 'What textbook and notebook subjects are inside the main zipper?',
      userId: ananya.id,
      status: 'OPEN',
    },
    {
      type: 'FOUND',
      title: 'Fastrack Sports Watch with Blue Strap',
      description: 'Found in the bleachers of YSET Sports & Indoor Complex after badminton practice.',
      category: 'ACCESSORIES',
      locationName: 'YSET Sports & Indoor Complex',
      latitude: 12.8730,
      longitude: 74.8492,
      dateLostOrFound: new Date(Date.now() - 12 * 60 * 60 * 1000),
      contactEmail: 'praveen.kumar@yenepoya.edu.in',
      secretQuestion: 'Describe the scratches or engraving on the rear dial.',
      userId: faculty.id,
      status: 'OPEN',
    },
  ];

  for (const itemData of items) {
    await prisma.item.create({ data: itemData });
  }

  console.log(`✅ Seeded ${items.length} Yenepoya Balmatta Mangalore incidents.`);
  console.log('🎉 Database updated successfully for Yenepoya School of Engineering & Technology, Balmatta!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
