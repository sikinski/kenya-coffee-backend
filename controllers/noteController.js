import prisma from '../config/db.js'

export const getNotes = async (request, reply) => {
    try {
        const notes = await prisma.note.findMany({
            include: {
                author: {
                    select: { name: true }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        // Подменим author_id на username
        const result = notes.map(({ author, ...note }) => ({
            ...note,
            author_name: author.name
        }));

        return reply.send(result)
        // reply.send() по умолчанию отправляет 200 OK.
    } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Ошибка получения заметок' })
    }
}

// ---------- POST /notes — создать заметку ---------- 
export const createNote = async (request, reply) => {
    const { text } = request.body

    if (!text) {
        return reply.status(400), send({ error: 'Поле text обязательно' })
    }

    try {
        const note = await prisma.note.create({
            data: {
                text,
                author_id: request.user.id
            },
            include: { author: true }
        })

        return reply.status(201).send({
            id: note.id,
            text: note.text,
            name: note.author.name,
            created_at: note.created_at,
            updated_at: note.updated_at
        })

    } catch (err) {
        return reply.status(400).send({ error: 'Ошибка создания заметки' })
    }
}

// ---------- PUT /notes — обновить заметку ---------- 
export const updateNote = async (request, reply) => {
    const { id } = request.params
    const { text } = request.body

    if (!text) {
        return reply.status(400).send({ error: 'Поле text обязательно' })
    }

    try {
        const note = await prisma.note.findUnique({ where: { id: Number(id) } })

        if (!note) {
            return reply.status(404).send({ error: 'Заметка не найдена' })
        }

        const updatedNote = await prisma.note.update({
            where: { id: Number(id) },
            data: { text },
            include: { author: true }
        })

        return reply.send({
            id: updatedNote.id,
            text: updatedNote.text,
            author_name: updatedNote.author,
            created_at: updateNote.created_at,
            updated_at: updateNote.updated_at
        })
    } catch (err) {
        return reply.status(500).send({ error: 'Ошибка обновления заметки' })
    }
}

// ---------- DELETE /notes — удалить заметку ---------- 
export const deleteNote = async (request, reply) => {
    const { id } = request.params

    try {
        const note = await prisma.note.findUnique({ where: { id: Number(id) } })

        if (!note) {
            reply.status(404).send({ error: 'Заметка не найдена' })
        }

        await prisma.note.delete({ where: { id: Number(id) } })
        // Если у тебя уже есть объект note (например, из findUnique), то можно сделать чуть короче:
        // await prisma.note.delete({
        //     where: { id: note.id }
        // });
        // 👉 Но всегда через { where: ... }.
        return reply.send({ success: true })
    } catch (err) {
        reply.status(500).send({ error: 'Ошибка удаления записи' })
    }
}