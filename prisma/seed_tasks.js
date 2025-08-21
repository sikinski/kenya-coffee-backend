import prisma from "../config/db.js";
import tasks from "./tasksData.js";

async function main() {
  const today = new Date();
  today.setHours(0,0,0,0);

  for (const task of tasks) {
    await prisma.dailyTask.create({
      data: {
        ...task,
        date: today,
        done: false
      }
    });
  }

  console.log("✅ Задачи добавлены на сегодня.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
