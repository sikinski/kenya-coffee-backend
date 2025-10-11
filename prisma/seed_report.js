import prisma from '../config/db.js'
import { ensureTodayReport } from '../functions/ensureTodayReport.js'

async function main() {
    await ensureTodayReport()
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
