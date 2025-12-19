import prisma from '../config/db.js'

// ======== TASKS ========  
export const getTasks = async (request, reply) => {
    try {
        const tasks = await prisma.task.findMany()
        return reply.status(200).send(tasks || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения задач' })
    }
}

export const createNewTask = async (request, reply) => {
    // TODO: Реализовать создание задачи
}

export const deleteTaskFromList = async (request, reply) => {
    // TODO: Реализовать удаление задачи
}

// ======== DAILY TASKS ========  
export const getDaily = async (request, reply) => {
    // TODO: Реализовать получение ежедневных задач
}

export const updateDaily = async (request, reply) => {
    // TODO: Реализовать обновление ежедневной задачи
}

export const deleteDaily = async (request, reply) => {
    // TODO: Реализовать удаление ежедневной задачи
}