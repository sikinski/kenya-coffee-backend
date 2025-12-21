import { getContacts, updateContacts } from '../controllers/contactsController.js'

export default async function (fastify) {
    fastify.get('/contacts', getContacts) // Публичный доступ
    fastify.put('/contacts', { preHandler: [fastify.authenticate] }, updateContacts)
}

