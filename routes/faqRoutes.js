import {
    getFAQs,
    getFAQ,
    createFAQ,
    updateFAQ,
    updateFAQsOrder,
    deleteFAQ
} from '../controllers/faqController.js'

export default async function (fastify) {
    // GET /faq - получить все FAQ
    fastify.get('/faq', { preHandler: [fastify.authenticate] }, getFAQs)

    // GET /faq/:id - получить FAQ по ID
    fastify.get('/faq/:id', { preHandler: [fastify.authenticate] }, getFAQ)

    // POST /faq - создать FAQ
    fastify.post('/faq', { preHandler: [fastify.authenticate] }, createFAQ)

    // PUT /faq/:id - обновить FAQ
    fastify.put('/faq/:id', { preHandler: [fastify.authenticate] }, updateFAQ)

    // PUT /faq/order - обновить порядок FAQ (массовое обновление)
    fastify.put('/faq/order', { preHandler: [fastify.authenticate] }, updateFAQsOrder)

    // DELETE /faq/:id - удалить FAQ
    fastify.delete('/faq/:id', { preHandler: [fastify.authenticate] }, deleteFAQ)
}

