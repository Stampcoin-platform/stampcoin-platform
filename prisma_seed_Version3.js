const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: bcrypt.hashSync('adminpass', 8),
      name: 'Admin',
      role: 'admin'
    }
  });

  await prisma.stamp.createMany({
    data: [
      {
        title: 'طابع نادر من مصر 1952',
        country: 'مصر',
        year: 1952,
        description: 'طابع تاريخي نادر لحادثة معروفة.',
        images: JSON.stringify(['/uploads/sample1.jpg']),
        isRare: true,
        condition: 'Very Fine',
        price: 25000,
        createdBy: admin.id
      },
      {
        title: 'طابع بريطانيا 1902',
        country: 'بريطانيا',
        year: 1902,
        description: 'نسخة قديمة بحالة جيدة.',
        images: JSON.stringify(['/uploads/sample2.jpg']),
        isRare: false,
        condition: 'Fine',
        price: 7500,
        createdBy: admin.id
      }
    ]
  });

  await prisma.contact.create({
    data: {
      name: 'زائر تجريبي',
      email: 'visitor@example.com',
      phone: '+000000000',
      message: 'رسالة اختبار من seed'
    }
  });

  const stamp = await prisma.stamp.findFirst();
  if (stamp) {
    await prisma.comment.create({
      data: {
        stampId: stamp.id,
        name: 'هاوي الطوابع',
        email: 'fan@example.com',
        body: 'تعليق تجريبي: هذه نسخة رائعة!'
      }
    });
  }

  console.log('Seeding done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });