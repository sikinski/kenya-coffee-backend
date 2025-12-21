import prisma from '../config/db.js'

// Инициализация контактов (создает пустую запись если её нет)
async function ensureContactsExist() {
    const existing = await prisma.contact.findFirst()
    if (!existing) {
        await prisma.contact.create({
            data: {
                phone: null,
                address: null,
                mapLink: null,
                workingHours: null,
                vkLink: null,
                telegramLink: null,
                whatsappLink: null
            }
        })
    }
}

// GET /contacts - получить контакты
export const getContacts = async (request, reply) => {
    try {
        // Убеждаемся, что запись существует
        await ensureContactsExist()

        // Получаем единственную запись контактов (синглтон)
        const contacts = await prisma.contact.findFirst()

        // Преобразуем workingHours из Json в массив
        const workingHours = contacts.workingHours ? (Array.isArray(contacts.workingHours) ? contacts.workingHours : []) : []

        return reply.status(200).send({
            phone: contacts.phone || '',
            address: contacts.address || '',
            mapLink: contacts.mapLink || '',
            workingHours: workingHours,
            vkLink: contacts.vkLink || '',
            telegramLink: contacts.telegramLink || '',
            whatsappLink: contacts.whatsappLink || ''
        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения контактов' })
    }
}

// PUT /contacts - обновить контакты
export const updateContacts = async (request, reply) => {
    try {
        const { phone, address, mapLink, workingHours, vkLink, telegramLink, whatsappLink } = request.body

        // Убеждаемся, что запись существует
        await ensureContactsExist()

        // Получаем существующую запись
        const existing = await prisma.contact.findFirst()

        // Валидация workingHours - должен быть массив или null
        const workingHoursArray = workingHours === null || workingHours === undefined
            ? null
            : (Array.isArray(workingHours) ? (workingHours.length > 0 ? workingHours : null) : null)

        // Обновляем контакты используя upsert
        const contacts = await prisma.contact.update({
            where: { id: existing.id },
            data: {
                phone: phone !== undefined ? (phone && phone.trim() ? phone.trim() : null) : existing.phone,
                address: address !== undefined ? (address && address.trim() ? address.trim() : null) : existing.address,
                mapLink: mapLink !== undefined ? (mapLink && mapLink.trim() ? mapLink.trim() : null) : existing.mapLink,
                workingHours: workingHours !== undefined ? workingHoursArray : existing.workingHours,
                vkLink: vkLink !== undefined ? (vkLink && vkLink.trim() ? vkLink.trim() : null) : existing.vkLink,
                telegramLink: telegramLink !== undefined ? (telegramLink && telegramLink.trim() ? telegramLink.trim() : null) : existing.telegramLink,
                whatsappLink: whatsappLink !== undefined ? (whatsappLink && whatsappLink.trim() ? whatsappLink.trim() : null) : existing.whatsappLink
            }
        })

        const workingHoursResult = contacts.workingHours ? (Array.isArray(contacts.workingHours) ? contacts.workingHours : []) : []

        return reply.status(200).send({
            phone: contacts.phone || '',
            address: contacts.address || '',
            mapLink: contacts.mapLink || '',
            workingHours: workingHoursResult,
            vkLink: contacts.vkLink || '',
            telegramLink: contacts.telegramLink || '',
            whatsappLink: contacts.whatsappLink || ''
        })
    } catch (err) {
        console.error('Ошибка обновления контактов:', err)
        return reply.status(500).send({
            error: 'Ошибка обновления контактов',
            details: err.message || String(err)
        })
    }
}

