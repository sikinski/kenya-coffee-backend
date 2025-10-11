import prisma from "../config/db.js";
import { updateDailyTasks } from '../functions/updateDailyTasks.js'

async function main() {
    await updateDailyTasks()
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
