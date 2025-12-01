// src/scripts/createUser.ts
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'diwan@studiofief.com';
  const password = 'test1234'; // mot de passe pour le login

  // hash du mot de passe
  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.users.upsert({
    where: { email },
    update: {}, // si l'email existe déjà, on ne change rien (ou tu peux mettre un update si tu veux)
    create: {
      email,
      password_hash,            // ⚠️ doit correspondre au champ Prisma
      display_name: 'Diwan',    // optionnel mais sympa
    },
  });

  console.log('✅ User created/ensured:');
  console.log({
    id: user.id.toString(),     // BigInt -> string pour l’affichage
    email: user.email,
    display_name: user.display_name,
  });
}

main()
  .catch((err) => {
    console.error('❌ Error while creating user:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
