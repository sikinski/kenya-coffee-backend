import prisma from "../config/db.js";

async function main() {
    // await updateDailyTasks()
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
