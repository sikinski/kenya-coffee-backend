import { getContacts, updateContacts } from '../controllers/contactsController.js'

export default async function (fastify) {
    fastify.get('/contacts', { preHandler: [fastify.authenticate] }, getContacts)
    fastify.put('/contacts', { preHandler: [fastify.authenticate] }, updateContacts)
}

