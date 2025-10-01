import { getNotes, createNote, updateNote, deleteNote } from '../controllers/noteController.js'
import { getNoteTopics, createNoteTopic, deleteNoteTopic } from '../controllers/noteController.js'

export default async function noteRoutes(fastify) {
    fastify.get('/notes', { preHandler: [fastify.authenticate] }, getNotes)
    fastify.post('/notes', { preHandler: [fastify.authenticate] }, createNote)
    fastify.put('/notes/:id', { preHandler: [fastify.authenticate] }, updateNote)
    fastify.delete('/notes/:id', { preHandler: [fastify.authenticate] }, deleteNote)

    fastify.get('/note-topics', { preHandler: [fastify.authenticate] }, getNoteTopics)
    fastify.post('/note-topics', { preHandler: [fastify.authenticate] }, createNoteTopic)
    fastify.delete('/note-topics/:id', { preHandler: [fastify.authenticate] }, deleteNoteTopic)
}