import bcrypt from 'bcryptjs';
import readline from 'readline';
import { prisma } from '../prisma.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n======================================================');
  console.log('   Smart School Fee - Initial Super Admin Setup CLI   ');
  console.log('======================================================\n');

  try {
    const email = (await question('Enter Super Admin Email: ')).trim().toLowerCase();
    if (!email || !email.includes('@')) {
      console.error('❌ Error: A valid email address is required.');
      process.exit(1);
    }

    const password = (await question('Enter Super Admin Password (min 8 chars): ')).trim();
    if (!password || password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long.');
      process.exit(1);
    }

    const fullName = (await question('Enter Full Name (e.g. Dr. Abebe Kebede): ')).trim() || 'Super Administrator';
    const fullNameAmharic = (await question('Enter Name in Amharic (optional): ')).trim() || null;
    const phone = (await question('Enter Phone Number (optional): ')).trim() || null;

    console.log('\nHashing credentials and updating database...');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        fullName,
        fullNameAmharic,
        phone,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      create: {
        email,
        passwordHash,
        fullName,
        fullNameAmharic,
        phone,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('\n✅ Super Admin account successfully configured!');
    console.log(`👤 User ID:   ${user.id}`);
    console.log(`📧 Email:     ${user.email}`);
    console.log(`👑 Role:      ${user.role}`);
    console.log('\nYou can now sign in at the web dashboard.\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
