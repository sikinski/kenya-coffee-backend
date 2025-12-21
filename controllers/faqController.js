import prisma from '../config/db.js'

// GET /faq - получить все FAQ
export const getFAQs = async (request, reply) => {
    try {
        const faqs = await prisma.fAQ.findMany({
            orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' }
            ]
        })

        return reply.status(200).send(faqs || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения FAQ' })
    }
}

// GET /faq/:id - получить FAQ по ID
export const getFAQ = async (request, reply) => {
    try {
        const { id } = request.params

        const faq = await prisma.fAQ.findUnique({
            where: { id: Number(id) }
        })

        if (!faq) {
            return reply.status(404).send({ error: 'FAQ не найден' })
        }

        return reply.status(200).send(faq)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения FAQ' })
    }
}

// POST /faq - создать FAQ
export const createFAQ = async (request, reply) => {
    try {
        const { question, answer, order, active } = request.body

        if (!question || !question.trim()) {
            return reply.status(400).send({ error: 'Поле question обязательно' })
        }

        if (!answer || !answer.trim()) {
            return reply.status(400).send({ error: 'Поле answer обязательно' })
        }

        // Если order не указан, ставим в конец
        let faqOrder = order
        if (faqOrder === undefined || faqOrder === null) {
            const lastFAQ = await prisma.fAQ.findFirst({
                orderBy: { order: 'desc' }
            })
            faqOrder = lastFAQ ? lastFAQ.order + 1 : 0
        }

        const faq = await prisma.fAQ.create({
            data: {
                question: question.trim(),
                answer: answer.trim(),
                order: Number(faqOrder),
                active: active !== undefined ? Boolean(active) : true
            }
        })

        return reply.status(201).send(faq)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка создания FAQ' })
    }
}

// PUT /faq/:id - обновить FAQ
export const updateFAQ = async (request, reply) => {
    try {
        const { id } = request.params
        const { question, answer, order, active } = request.body

        const faq = await prisma.fAQ.findUnique({ where: { id: Number(id) } })
        if (!faq) {
            return reply.status(404).send({ error: 'FAQ не найден' })
        }

        const updateData = {}
        if (question !== undefined) {
            if (!question || !question.trim()) {
                return reply.status(400).send({ error: 'Поле question не может быть пустым' })
            }
            updateData.question = question.trim()
        }
        if (answer !== undefined) {
            if (!answer || !answer.trim()) {
                return reply.status(400).send({ error: 'Поле answer не может быть пустым' })
            }
            updateData.answer = answer.trim()
        }
        if (order !== undefined) updateData.order = Number(order)
        if (active !== undefined) updateData.active = Boolean(active)

        const updatedFAQ = await prisma.fAQ.update({
            where: { id: Number(id) },
            data: updateData
        })

        return reply.status(200).send(updatedFAQ)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления FAQ' })
    }
}

// PUT /faq/order - обновить порядок FAQ (массовое обновление)
export const updateFAQsOrder = async (request, reply) => {
    try {
        const { faqs } = request.body // массив { id, order }

        if (!Array.isArray(faqs)) {
            return reply.status(400).send({ error: 'Неверный формат данных' })
        }

        // Обновляем порядок всех FAQ
        const updates = faqs.map(({ id, order }) =>
            prisma.fAQ.update({
                where: { id: Number(id) },
                data: { order: Number(order) }
            })
        )

        await Promise.all(updates)

        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления порядка FAQ' })
    }
}

// DELETE /faq/:id - удалить FAQ
export const deleteFAQ = async (request, reply) => {
    try {
        const { id } = request.params

        const faq = await prisma.fAQ.findUnique({ where: { id: Number(id) } })
        if (!faq) {
            return reply.status(404).send({ error: 'FAQ не найден' })
        }

        await prisma.fAQ.delete({ where: { id: Number(id) } })

        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка удаления FAQ' })
    }
}

