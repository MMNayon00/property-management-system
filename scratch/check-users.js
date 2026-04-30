import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
