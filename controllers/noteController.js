import prisma from '../config/db.js'

export const getNotes = async (request, reply) => {
    const { topics } = request.query

    try {
        // Преобразуем строку '2,3,5' в массив чисел [2,3,5]
        const topicIds = topics
            ? topics.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean)
            : null;
        const notes = await prisma.note.findMany({
            where: topicIds ? { topicId: { in: topicIds } } : {},
            include: {
                author: { select: { name: true } },
                topic: { select: { name: true, color: true } } // если нужно вернуть тему тоже
            },
            orderBy: { created_at: 'desc' }
        });

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
    const { text, topicId } = request.body

    if (!text) {
        return reply.status(400), send({ error: 'Поле text обязательно' })
    }

    try {
        const note = await prisma.note.create({
            data: {
                text,
                topicId,
                author_id: request.user.id
            },
            include: { author: true }
        })

        return reply.status(201).send({
            id: note.id,
            text: note.text,
            topicId: note.topicId,
            name: note.author.name,
            created_at: note.created_at,
            updated_at: note.updated_at
        })

    } catch (err) {
        return reply.status(400).send({ error: 'Ошибка создания заметки' })
    }
}

// ---------- PUT /notes ---------- 
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

// ---------- DELETE /notes ---------- 
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

// ========================== NOTE TOPIC ========================== 
// POST /note-topics
export const createNoteTopic = async (request, reply) => {
    const { name, color } = request.body;

    if (!name || !color) {
        return reply.status(400).send({ error: 'Все поля обязательны.' });
    }

    try {
        const noteTopic = await prisma.noteTopic.create({
            data: {
                name,
                color
            }
        });

        return reply.status(201).send(noteTopic);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Ошибка создания топика' });
    }
}

// GET /note-topics
export const getNoteTopics = async (request, reply) => {
    try {
        const noteTopics = await prisma.noteTopic.findMany({
            orderBy: { created_at: 'desc' }
        })

        return reply.status(200).send(noteTopics || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения тем заметок' })
    }
}

// DELETE /note-topics/:id
export const deleteNoteTopic = async (request, reply) => {
    const { id } = request.params

    if (!id) {
        return reply.status(400).send({ error: 'Параметр ID обязателен' })
    }
    try {
        const noteTopic = await prisma.noteTopic.findUnique({
            where: {
                id: Number(id),
            },
            include: { notes: true } // подтягиваем заметки, чтоб проверить, есть ли у темы связанные заметки.
        })

        if (!noteTopic) {
            return reply.status(404).send({ error: 'Тема не найдена' })
        }

        if (noteTopic.notes.length > 0) {
            return reply.status(400).send({ error: 'У темы есть заметки. Удалите привязанные заметки, чтоб удалить тему.' })
        }

        await prisma.noteTopic.delete({
            where: {
                id: Number(id)
            }
        })

        return reply.status(200).send({ message: 'Тема успешно удалена' })

    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: `Не удалось удалить тему заметки` })
    }
}