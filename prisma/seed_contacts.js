import prisma from '../config/db.js'

async function seedContacts() {
    try {
        // Проверяем, есть ли уже контакты
        const existing = await prisma.contact.findFirst()
        
        if (existing) {
            console.log('Контакты уже существуют, пропускаем создание')
            return
        }

        // Создаем пустую запись контактов
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

        console.log('✅ Контакты успешно созданы с пустыми значениями')
    } catch (error) {
        console.error('❌ Ошибка создания контактов:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

seedContacts()

