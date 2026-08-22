"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🧹 Clearing all unregistered / placeholder lost and found items...');
    // Delete all claims, messages, notifications, and items
    await prisma.chatMessage.deleteMany({});
    await prisma.claim.deleteMany({});
    await prisma.matchNotification.deleteMany({});
    await prisma.item.deleteMany({});
    console.log('✅ All unregistered / test items have been removed.');
    console.log('✨ The system is now clean and ready for real student & staff registrations!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
