import { getNotes, createNote, updateNote, deleteNote } from '../controllers/noteController.js'

export default async function noteRoutes(fastify) {
    fastify.get('/notes', { preHandler: [fastify.authenticate] }, getNotes)
    fastify.post('/notes', { preHandler: [fastify.authenticate] }, createNote)
    fastify.put('/notes/:id', { preHandler: [fastify.authenticate] }, updateNote)
    fastify.delete('/notes/:id', { preHandler: [fastify.authenticate] }, deleteNote)
}