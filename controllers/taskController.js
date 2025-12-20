import prisma from '../config/db.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Asia/Yekaterinburg'

// ======== TASKS (базовый список задач) ========  
export const getTasks = async (request, reply) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' }
            ]
        })
        return reply.status(200).send(tasks || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения задач' })
    }
}

export const createTask = async (request, reply) => {
    try {
        const { text, priority = 'normal', order } = request.body

        if (!text || !text.trim()) {
            return reply.status(400).send({ error: 'Текст задачи обязателен' })
        }

        // Если order не указан, ставим в конец
        let taskOrder = order
        if (taskOrder === undefined || taskOrder === null) {
            const lastTask = await prisma.task.findFirst({
                orderBy: { order: 'desc' }
            })
            taskOrder = lastTask ? lastTask.order + 1 : 0
        }

        // Проверяем валидность priority
        const validPriorities = ['low', 'normal', 'high']
        const taskPriority = validPriorities.includes(priority) ? priority : 'normal'

        const task = await prisma.task.create({
            data: {
                text: text.trim(),
                priority: taskPriority,
                order: taskOrder,
                active: true
            }
        })

        return reply.status(201).send(task)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка создания задачи' })
    }
}

export const updateTask = async (request, reply) => {
    try {
        const { id } = request.params
        const { text, priority, order, active } = request.body

        const task = await prisma.task.findUnique({ where: { id: Number(id) } })
        if (!task) {
            return reply.status(404).send({ error: 'Задача не найдена' })
        }

        const updateData = {}
        if (text !== undefined) updateData.text = text.trim()
        if (priority !== undefined) {
            const validPriorities = ['low', 'normal', 'high']
            updateData.priority = validPriorities.includes(priority) ? priority : task.priority
        }
        if (order !== undefined) updateData.order = Number(order)
        if (active !== undefined) updateData.active = Boolean(active)

        const updatedTask = await prisma.task.update({
            where: { id: Number(id) },
            data: updateData
        })

        return reply.status(200).send(updatedTask)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления задачи' })
    }
}

export const updateTasksOrder = async (request, reply) => {
    try {
        const { tasks } = request.body // массив { id, order }

        if (!Array.isArray(tasks)) {
            return reply.status(400).send({ error: 'Неверный формат данных' })
        }

        // Обновляем порядок всех задач
        const updates = tasks.map(({ id, order }) =>
            prisma.task.update({
                where: { id: Number(id) },
                data: { order: Number(order) }
            })
        )

        await Promise.all(updates)

        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления порядка задач' })
    }
}

export const deleteTask = async (request, reply) => {
    try {
        const { id } = request.params

        const task = await prisma.task.findUnique({ where: { id: Number(id) } })
        if (!task) {
            return reply.status(404).send({ error: 'Задача не найдена' })
        }

        await prisma.task.delete({ where: { id: Number(id) } })

        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка удаления задачи' })
    }
}

// ======== DAILY TASKS (ежедневные задачи) ========  
export const getDailyTasks = async (request, reply) => {
    try {
        const { date } = request.query

        // Если дата не указана, берем сегодня
        const targetDate = date
            ? dayjs.tz(date, 'YYYY-MM-DD', TZ).startOf('day')
            : dayjs().tz(TZ).startOf('day')

        if (!targetDate.isValid()) {
            return reply.status(400).send({ error: 'Неверный формат даты. Используйте YYYY-MM-DD' })
        }

        const dailyTasks = await prisma.dailyTask.findMany({
            where: {
                date: targetDate.toDate()
            },
            include: {
                task: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                task: {
                    order: 'asc'
                }
            }
        })

        return reply.status(200).send(dailyTasks || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения ежедневных задач' })
    }
}

export const updateDailyTask = async (request, reply) => {
    try {
        const { id } = request.params
        const { done, userId } = request.body

        const dailyTask = await prisma.dailyTask.findUnique({
            where: { id: Number(id) },
            include: { task: true }
        })

        if (!dailyTask) {
            return reply.status(404).send({ error: 'Ежедневная задача не найдена' })
        }

        const updateData = {}
        if (done !== undefined) updateData.done = Boolean(done)
        if (userId !== undefined) {
            // Проверяем, что пользователь существует
            if (userId !== null) {
                const user = await prisma.user.findUnique({ where: { id: Number(userId) } })
                if (!user) {
                    return reply.status(404).send({ error: 'Пользователь не найден' })
                }
            }
            updateData.userId = userId ? Number(userId) : null
        }

        const updated = await prisma.dailyTask.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                task: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return reply.status(200).send(updated)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления ежедневной задачи' })
    }
}

export const deleteDailyTask = async (request, reply) => {
    try {
        const { id } = request.params

        const dailyTask = await prisma.dailyTask.findUnique({ where: { id: Number(id) } })
        if (!dailyTask) {
            return reply.status(404).send({ error: 'Ежедневная задача не найдена' })
        }

        await prisma.dailyTask.delete({ where: { id: Number(id) } })

        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка удаления ежедневной задачи' })
    }
}

// Синхронизация сегодняшнего чеклиста с шаблоном задач
export const syncTodayChecklist = async (request, reply) => {
    try {
        const today = dayjs().tz(TZ).startOf('day').toDate()

        // Получаем все активные задачи из шаблона, отсортированные по order
        const activeTasks = await prisma.task.findMany({
            where: { active: true },
            orderBy: { order: 'asc' }
        })

        // Получаем все ежедневные задачи на сегодня
        const todayDailyTasks = await prisma.dailyTask.findMany({
            where: { date: today },
            include: { task: true }
        })

        // Создаем мапу существующих ежедневных задач по taskId
        const dailyTasksMap = new Map(todayDailyTasks.map(dt => [dt.taskId, dt]))

        // Массивы для операций
        const tasksToCreate = []
        const tasksToDelete = []

        // 1. Проходим по активным задачам из шаблона
        for (const task of activeTasks) {
            const existingDailyTask = dailyTasksMap.get(task.id)

            if (!existingDailyTask) {
                // Задачи нет в сегодняшнем чеклисте - создаем
                tasksToCreate.push({
                    date: today,
                    taskId: task.id,
                    done: false
                })
            }
            // Если задача уже есть, ничего не делаем (сохраняем её состояние done и userId)
        }

        // 2. Проходим по существующим ежедневным задачам
        for (const dailyTask of todayDailyTasks) {
            const taskExistsInTemplate = activeTasks.some(t => t.id === dailyTask.taskId)

            if (!taskExistsInTemplate) {
                // Задачи нет в шаблоне
                // Удаляем только если done: false (невыполненные задачи можно удалить)
                if (!dailyTask.done) {
                    tasksToDelete.push(dailyTask.id)
                }
                // Если done: true - оставляем (не удаляем выполненные задачи)
            }
        }

        // Выполняем операции
        const results = {
            created: 0,
            deleted: 0,
            kept: 0
        }

        if (tasksToCreate.length > 0) {
            await prisma.dailyTask.createMany({
                data: tasksToCreate
            })
            results.created = tasksToCreate.length
        }

        if (tasksToDelete.length > 0) {
            await prisma.dailyTask.deleteMany({
                where: { id: { in: tasksToDelete } }
            })
            results.deleted = tasksToDelete.length
        }

        // Подсчитываем, сколько задач оставлено (выполненные, которых нет в шаблоне)
        results.kept = todayDailyTasks.filter(dt => {
            const taskExistsInTemplate = activeTasks.some(t => t.id === dt.taskId)
            return !taskExistsInTemplate && dt.done
        }).length

        // Получаем обновленный список задач на сегодня
        const updatedDailyTasks = await prisma.dailyTask.findMany({
            where: { date: today },
            include: {
                task: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                task: {
                    order: 'asc'
                }
            }
        })

        return reply.status(200).send({
            success: true,
            results,
            dailyTasks: updatedDailyTasks
        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка синхронизации чеклиста' })
    }
}
