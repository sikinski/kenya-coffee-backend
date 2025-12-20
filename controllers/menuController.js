import prisma from '../config/db.js'
import { deleteImages } from '../utils/imageProcessor.js'

// Функция для валидации и нормализации цены
function validateAndNormalizePrice(price) {
    // Если price не передан, возвращаем ошибку
    if (price === undefined || price === null) {
        return { error: 'Поле price обязательно' }
    }

    // Если price - это объект
    if (typeof price === 'object' && !Array.isArray(price)) {
        const { from, to } = price

        // Хотя бы одно поле должно быть заполнено
        if (from === null && to === null) {
            return { error: 'Необходимо указать хотя бы одно поле: from или to' }
        }

        // Валидация from
        let fromValue = null
        if (from !== null && from !== undefined && from !== '') {
            const fromNum = Number(from)
            if (isNaN(fromNum) || fromNum < 0) {
                return { error: 'Поле from должно быть положительным числом' }
            }
            fromValue = fromNum
        }

        // Валидация to
        let toValue = null
        if (to !== null && to !== undefined && to !== '') {
            const toNum = Number(to)
            if (isNaN(toNum) || toNum < 0) {
                return { error: 'Поле to должно быть положительным числом' }
            }
            toValue = toNum
        }

        // Если оба значения заданы, проверяем что from <= to
        if (fromValue !== null && toValue !== null && fromValue > toValue) {
            return { error: 'Значение from не может быть больше to' }
        }

        return { price: { from: fromValue, to: toValue } }
    }

    // Если передано просто число (для обратной совместимости)
    if (typeof price === 'number' || (typeof price === 'string' && !isNaN(price))) {
        const numPrice = Number(price)
        if (numPrice < 0) {
            return { error: 'Цена должна быть положительным числом' }
        }
        return { price: { from: numPrice, to: numPrice } }
    }

    return { error: 'Поле price должно быть объектом с полями from и to, или числом' }
}

// Функция для валидации и нормализации массива изображений
function validateAndNormalizeImages(images) {
    // Если images не передан, возвращаем пустой массив
    if (images === undefined || images === null) {
        return { images: [] }
    }

    // Если передан пустой массив
    if (Array.isArray(images) && images.length === 0) {
        return { images: [] }
    }

    // Если передан массив
    if (Array.isArray(images)) {
        const validatedImages = []
        for (let i = 0; i < images.length; i++) {
            const img = images[i]

            // Каждый элемент должен быть объектом
            if (!img || typeof img !== 'object' || Array.isArray(img)) {
                return { error: `Элемент ${i} массива images должен быть объектом с полями imageOrg и imageThumbnail` }
            }

            const { imageOrg, imageThumbnail } = img

            // Оба поля должны быть строками
            if (imageOrg === undefined || imageOrg === null || typeof imageOrg !== 'string') {
                return { error: `Элемент ${i}: поле imageOrg обязательно и должно быть строкой` }
            }

            if (imageThumbnail === undefined || imageThumbnail === null || typeof imageThumbnail !== 'string') {
                return { error: `Элемент ${i}: поле imageThumbnail обязательно и должно быть строкой` }
            }

            const trimmedOrg = imageOrg.trim()
            const trimmedThumb = imageThumbnail.trim()

            // Проверяем, что после trim строки не пустые
            if (!trimmedOrg || !trimmedThumb) {
                return { error: `Элемент ${i}: поля imageOrg и imageThumbnail не могут быть пустыми` }
            }

            validatedImages.push({
                imageOrg: trimmedOrg,
                imageThumbnail: trimmedThumb
            })
        }

        return { images: validatedImages }
    }

    return { error: 'Поле images должно быть массивом объектов с полями imageOrg и imageThumbnail' }
}

// Функция для удаления всех изображений из массива
async function deleteImagesArray(imagesArray) {
    if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
        return
    }

    const deletePromises = imagesArray.map(img => {
        if (img && img.imageOrg && img.imageThumbnail) {
            return deleteImages(img.imageOrg, img.imageThumbnail)
        }
        return Promise.resolve()
    })

    await Promise.all(deletePromises)
}

// ========== TYPES (Типы позиций) ==========
export const getMenuItemTypes = async (request, reply) => {
    try {
        const types = await prisma.menuItemType.findMany({
            orderBy: { order: 'asc' }
        })
        return reply.status(200).send(types || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения типов' })
    }
}

export const createMenuItemType = async (request, reply) => {
    try {
        const { name, description, order, icon } = request.body

        if (!name || !name.trim()) {
            return reply.status(400).send({ error: 'Название типа обязательно' })
        }

        // Валидация icon: должен быть SVG data URI или null/undefined (поле необязательное)
        let iconValue = null
        if (icon !== undefined && icon !== null && icon !== '') {
            const iconStr = String(icon).trim()
            // Проверяем, что это data URI для SVG
            if (iconStr.startsWith('data:image/svg+xml')) {
                iconValue = iconStr
            } else {
                return reply.status(400).send({ error: 'Иконка должна быть в формате SVG data URI (data:image/svg+xml;base64,...)' })
            }
        }

        const type = await prisma.menuItemType.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                icon: iconValue,
                order: order !== undefined ? Number(order) : 0
            }
        })

        return reply.status(201).send(type)
    } catch (err) {
        if (err.code === 'P2002') {
            return reply.status(400).send({ error: 'Тип с таким названием уже существует' })
        }
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка создания типа' })
    }
}

export const updateMenuItemType = async (request, reply) => {
    try {
        const { id } = request.params
        const { name, description, order, icon } = request.body

        const type = await prisma.menuItemType.findUnique({ where: { id: Number(id) } })
        if (!type) {
            return reply.status(404).send({ error: 'Тип не найден' })
        }

        const updateData = {}
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (order !== undefined) updateData.order = Number(order)

        // Обработка icon: должен быть SVG data URI или null (поле необязательное)
        if (icon !== undefined) {
            if (icon === null || icon === '') {
                updateData.icon = null
            } else {
                const iconStr = String(icon).trim()
                // Проверяем, что это data URI для SVG
                if (iconStr.startsWith('data:image/svg+xml')) {
                    updateData.icon = iconStr
                } else {
                    return reply.status(400).send({ error: 'Иконка должна быть в формате SVG data URI (data:image/svg+xml;base64,...)' })
                }
            }
        }

        const updated = await prisma.menuItemType.update({
            where: { id: Number(id) },
            data: updateData
        })

        return reply.status(200).send(updated)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления типа' })
    }
}

export const deleteMenuItemType = async (request, reply) => {
    try {
        const { id } = request.params

        // Проверяем, есть ли позиции с этим типом (через many-to-many связь)
        const itemsCount = await prisma.menuItem.count({
            where: {
                types: {
                    some: {
                        id: Number(id)
                    }
                }
            }
        })

        if (itemsCount > 0) {
            return reply.status(400).send({
                error: `Нельзя удалить тип, так как есть ${itemsCount} позиций с этим типом`
            })
        }

        await prisma.menuItemType.delete({ where: { id: Number(id) } })
        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка удаления типа' })
    }
}

// ========== TAGS (Теги) ==========
export const getMenuTags = async (request, reply) => {
    try {
        const tags = await prisma.menuTag.findMany({
            orderBy: { name: 'asc' }
        })
        return reply.status(200).send(tags || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения тегов' })
    }
}

export const createMenuTag = async (request, reply) => {
    try {
        const { name, color, category, icon } = request.body

        if (!name || !name.trim()) {
            return reply.status(400).send({ error: 'Название тега обязательно' })
        }

        // Валидация color: должен быть hex значение или null/undefined (поле необязательное)
        let colorValue = null
        if (color !== undefined && color !== null && color !== '') {
            const colorStr = String(color).trim()
            // Проверяем формат hex цвета (#RRGGBB или #RGB)
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
            if (hexColorRegex.test(colorStr)) {
                colorValue = colorStr
            } else {
                return reply.status(400).send({ error: 'Цвет должен быть в формате hex (например, #FF0000 или #F00)' })
            }
        }

        // Валидация icon: должен быть SVG data URI или null/undefined (поле необязательное)
        let iconValue = null
        if (icon !== undefined && icon !== null && icon !== '') {
            const iconStr = String(icon).trim()
            // Проверяем, что это data URI для SVG
            if (iconStr.startsWith('data:image/svg+xml')) {
                iconValue = iconStr
            } else {
                return reply.status(400).send({ error: 'Иконка должна быть в формате SVG data URI (data:image/svg+xml;base64,...)' })
            }
        }

        const tag = await prisma.menuTag.create({
            data: {
                name: name.trim(),
                color: colorValue,
                icon: iconValue,
                category: category?.trim() || null
            }
        })

        return reply.status(201).send(tag)
    } catch (err) {
        if (err.code === 'P2002') {
            return reply.status(400).send({ error: 'Тег с таким названием уже существует' })
        }
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка создания тега' })
    }
}

export const updateMenuTag = async (request, reply) => {
    try {
        const { id } = request.params
        const { name, color, category, icon } = request.body

        const tag = await prisma.menuTag.findUnique({ where: { id: Number(id) } })
        if (!tag) {
            return reply.status(404).send({ error: 'Тег не найден' })
        }

        const updateData = {}
        if (name !== undefined) updateData.name = name.trim()

        // Обработка color: должен быть hex значение или null (поле необязательное)
        if (color !== undefined) {
            if (color === null || color === '') {
                updateData.color = null
            } else {
                const colorStr = String(color).trim()
                // Проверяем формат hex цвета (#RRGGBB или #RGB)
                const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
                if (hexColorRegex.test(colorStr)) {
                    updateData.color = colorStr
                } else {
                    return reply.status(400).send({ error: 'Цвет должен быть в формате hex (например, #FF0000 или #F00)' })
                }
            }
        }

        // Обработка icon: должен быть SVG data URI или null (поле необязательное)
        if (icon !== undefined) {
            if (icon === null || icon === '') {
                updateData.icon = null
            } else {
                const iconStr = String(icon).trim()
                // Проверяем, что это data URI для SVG
                if (iconStr.startsWith('data:image/svg+xml')) {
                    updateData.icon = iconStr
                } else {
                    return reply.status(400).send({ error: 'Иконка должна быть в формате SVG data URI (data:image/svg+xml;base64,...)' })
                }
            }
        }

        if (category !== undefined) updateData.category = category?.trim() || null

        const updated = await prisma.menuTag.update({
            where: { id: Number(id) },
            data: updateData
        })

        return reply.status(200).send(updated)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления тега' })
    }
}

export const deleteMenuTag = async (request, reply) => {
    try {
        const { id } = request.params
        await prisma.menuTag.delete({ where: { id: Number(id) } })
        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка удаления тега' })
    }
}

// ========== ITEMS (Позиции меню) ==========
// Функция для определения приоритета сортировки на основе тегов
function getSortPriority(item) {
    const tagNames = item.tags.map(tag => tag.name.toLowerCase())

    // Приоритет 1: новинка или сезонное
    if (tagNames.includes('новинка') || tagNames.includes('сезонное')) {
        return 1
    }
    // Приоритет 2: хит
    if (tagNames.includes('хит')) {
        return 2
    }
    // Приоритет 3: остальные
    return 3
}

export const getMenuItems = async (request, reply) => {
    try {
        const { typeIds, active, tagIds } = request.query

        const where = {}
        if (typeIds) {
            const typeIdsArray = typeIds.split(',').map(id => Number(id.trim())).filter(Boolean)
            if (typeIdsArray.length > 0) {
                where.types = { some: { id: { in: typeIdsArray } } }
            }
        }
        if (active !== undefined) where.active = active === 'true'
        if (tagIds) {
            const tagIdsArray = tagIds.split(',').map(id => Number(id.trim())).filter(Boolean)
            if (tagIdsArray.length > 0) {
                where.tags = { some: { id: { in: tagIdsArray } } }
            }
        }

        const items = await prisma.menuItem.findMany({
            where,
            include: {
                types: true,
                tags: true
            },
            orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' }
            ]
        })

        // Сортируем: новинки/сезонное -> хиты -> по order
        const sortedItems = items.sort((a, b) => {
            const priorityA = getSortPriority(a)
            const priorityB = getSortPriority(b)

            if (priorityA !== priorityB) {
                return priorityA - priorityB
            }

            // Если приоритет одинаковый, сортируем по order
            return a.order - b.order
        })

        return reply.status(200).send(sortedItems || [])
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения позиций меню' })
    }
}

export const getMenuItem = async (request, reply) => {
    try {
        const { id } = request.params

        const item = await prisma.menuItem.findUnique({
            where: { id: Number(id) },
            include: {
                types: true,
                tags: true
            }
        })

        if (!item) {
            return reply.status(404).send({ error: 'Позиция не найдена' })
        }

        return reply.status(200).send(item)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения позиции' })
    }
}

export const createMenuItem = async (request, reply) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            typeIds,
            quantity,
            volume,
            order,
            tagIds,
            images
        } = request.body

        if (!name || !typeIds) {
            return reply.status(400).send({
                error: 'Поля name и typeIds обязательны'
            })
        }

        // Валидация и нормализация цены
        const priceValidation = validateAndNormalizePrice(price)
        if (priceValidation.error) {
            return reply.status(400).send({ error: priceValidation.error })
        }

        // Парсим типы (всегда массив)
        if (!Array.isArray(typeIds) || typeIds.length === 0) {
            return reply.status(400).send({ error: 'Необходимо указать хотя бы один тип' })
        }

        const typeIdsArray = typeIds.map(id => Number(id)).filter(id => !isNaN(id))
        if (typeIdsArray.length === 0) {
            return reply.status(400).send({ error: 'Необходимо указать хотя бы один тип' })
        }

        // Проверяем, что все типы существуют
        const types = await prisma.menuItemType.findMany({
            where: { id: { in: typeIdsArray } }
        })
        if (types.length !== typeIdsArray.length) {
            return reply.status(404).send({ error: 'Один или несколько типов не найдены' })
        }

        // Парсим теги (всегда массив)
        const tagsToConnect = []
        if (Array.isArray(tagIds) && tagIds.length > 0) {
            const tagIdsArray = tagIds.map(id => Number(id)).filter(id => !isNaN(id))
            tagsToConnect.push(...tagIdsArray.map(id => ({ id })))
        }

        // Определяем order - если не указан, ставим в конец
        let itemOrder = 0
        if (order !== undefined && order !== null && order !== '') {
            itemOrder = Number(order)
            // Сдвигаем позиции с order >= нового order
            await prisma.menuItem.updateMany({
                where: { order: { gte: itemOrder } },
                data: { order: { increment: 1 } }
            })
        } else {
            // Если order не указан, ставим в конец
            const lastItem = await prisma.menuItem.findFirst({
                orderBy: { order: 'desc' }
            })
            itemOrder = lastItem ? lastItem.order + 1 : 0
        }

        // Обрабатываем volume как массив строк
        let volumeArray = []
        if (Array.isArray(volume)) {
            volumeArray = volume.map(v => String(v).trim()).filter(v => v.length > 0)
        } else if (volume !== undefined && volume !== null) {
            // Если передана строка (для обратной совместимости), преобразуем в массив
            const trimmed = String(volume).trim()
            if (trimmed.length > 0) {
                volumeArray = [trimmed]
            }
        }

        // Валидация и нормализация изображений
        const imagesValidation = validateAndNormalizeImages(images)
        if (imagesValidation.error) {
            return reply.status(400).send({ error: imagesValidation.error })
        }

        const item = await prisma.menuItem.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                price: priceValidation.price,
                discountPrice: discountPrice ? Number(discountPrice) : null,
                quantity: quantity ? Number(quantity) : null,
                volume: volumeArray,
                order: itemOrder,
                images: imagesValidation.images,
                types: {
                    connect: typeIdsArray.map(id => ({ id }))
                },
                tags: {
                    connect: tagsToConnect
                }
            },
            include: {
                types: true,
                tags: true
            }
        })

        return reply.status(201).send(item)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка создания позиции' })
    }
}

export const updateMenuItem = async (request, reply) => {
    try {
        const { id } = request.params

        const item = await prisma.menuItem.findUnique({
            where: { id: Number(id) },
            include: { tags: true }
        })

        if (!item) {
            return reply.status(404).send({ error: 'Позиция не найдена' })
        }

        const {
            name,
            description,
            price,
            discountPrice,
            typeIds,
            quantity,
            volume,
            order,
            active,
            tagIds,
            images
        } = request.body

        const updateData = {}
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null

        // Обработка цены
        if (price !== undefined) {
            const priceValidation = validateAndNormalizePrice(price)
            if (priceValidation.error) {
                return reply.status(400).send({ error: priceValidation.error })
            }
            updateData.price = priceValidation.price
        }
        if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? Number(discountPrice) : null
        if (quantity !== undefined) updateData.quantity = quantity ? Number(quantity) : null
        if (volume !== undefined) {
            // Обрабатываем volume как массив строк
            if (Array.isArray(volume)) {
                updateData.volume = volume.map(v => String(v).trim()).filter(v => v.length > 0)
            } else if (volume === null) {
                updateData.volume = []
            } else {
                // Если передана строка (для обратной совместимости), преобразуем в массив
                const trimmed = String(volume).trim()
                updateData.volume = trimmed.length > 0 ? [trimmed] : []
            }
        }
        if (active !== undefined) updateData.active = active === 'true' || active === true

        // Обработка изображений
        if (images !== undefined) {
            const imagesValidation = validateAndNormalizeImages(images)
            if (imagesValidation.error) {
                return reply.status(400).send({ error: imagesValidation.error })
            }

            // Получаем старые изображения
            const oldImages = Array.isArray(item.images) ? item.images : []
            const newImages = imagesValidation.images

            // Находим изображения, которые нужно удалить (те, которых нет в новом массиве)
            const imagesToDelete = oldImages.filter(oldImg => {
                return !newImages.some(newImg =>
                    newImg.imageOrg === oldImg.imageOrg &&
                    newImg.imageThumbnail === oldImg.imageThumbnail
                )
            })

            // Удаляем файлы изображений, которые больше не используются
            if (imagesToDelete.length > 0) {
                await deleteImagesArray(imagesToDelete)
            }

            updateData.images = newImages
        }

        // Обработка типов (many-to-many, всегда массив)
        if (typeIds !== undefined) {
            if (!Array.isArray(typeIds) || typeIds.length === 0) {
                return reply.status(400).send({ error: 'Необходимо указать хотя бы один тип' })
            }

            const typeIdsArray = typeIds.map(id => Number(id)).filter(id => !isNaN(id))
            if (typeIdsArray.length === 0) {
                return reply.status(400).send({ error: 'Необходимо указать хотя бы один тип' })
            }

            // Проверяем, что все типы существуют
            const types = await prisma.menuItemType.findMany({
                where: { id: { in: typeIdsArray } }
            })
            if (types.length !== typeIdsArray.length) {
                return reply.status(404).send({ error: 'Один или несколько типов не найдены' })
            }

            updateData.types = {
                set: typeIdsArray.map(id => ({ id }))
            }
        }

        // Обработка order с автоматическим сдвигом
        if (order !== undefined) {
            const newOrder = Number(order)
            const oldOrder = item.order

            if (newOrder !== oldOrder) {
                // Если новый order больше старого, сдвигаем позиции вниз
                if (newOrder > oldOrder) {
                    await prisma.menuItem.updateMany({
                        where: {
                            id: { not: Number(id) },
                            order: { gt: oldOrder, lte: newOrder }
                        },
                        data: { order: { decrement: 1 } }
                    })
                } else {
                    // Если новый order меньше старого, сдвигаем позиции вверх
                    await prisma.menuItem.updateMany({
                        where: {
                            id: { not: Number(id) },
                            order: { gte: newOrder, lt: oldOrder }
                        },
                        data: { order: { increment: 1 } }
                    })
                }
                updateData.order = newOrder
            }
        }

        // Обновляем теги (всегда массив)
        if (tagIds !== undefined) {
            const tagIdsArray = Array.isArray(tagIds)
                ? tagIds.map(id => Number(id)).filter(id => !isNaN(id))
                : []
            updateData.tags = {
                set: tagIdsArray.map(id => ({ id }))
            }
        }

        const updated = await prisma.menuItem.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                types: true,
                tags: true
            }
        })

        return reply.status(200).send(updated)
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления позиции' })
    }
}

export const updateMenuItemsOrder = async (request, reply) => {
    try {
        const { items } = request.body // массив { id, order }

        if (!Array.isArray(items)) {
            return reply.status(400).send({ error: 'Неверный формат данных. Ожидается массив items' })
        }

        // Обновляем порядок всех позиций
        const updates = items.map(({ id, order }) =>
            prisma.menuItem.update({
                where: { id: Number(id) },
                data: { order: Number(order) }
            })
        )

        await Promise.all(updates)

        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления порядка позиций' })
    }
}

export const deleteMenuItem = async (request, reply) => {
    try {
        const { id } = request.params

        const item = await prisma.menuItem.findUnique({ where: { id: Number(id) } })
        if (!item) {
            return reply.status(404).send({ error: 'Позиция не найдена' })
        }

        // Удаляем все изображения из массива (файлы с диска)
        if (item.images) {
            if (Array.isArray(item.images) && item.images.length > 0) {
                await deleteImagesArray(item.images)
            }
        }

        // Сдвигаем order остальных позиций вверх
        await prisma.menuItem.updateMany({
            where: { order: { gt: item.order } },
            data: { order: { decrement: 1 } }
        })

        await prisma.menuItem.delete({ where: { id: Number(id) } })
        return reply.status(200).send({ success: true })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка удаления позиции' })
    }
}

// ========== MENU (Актуальное меню) ==========
export const getMenu = async (request, reply) => {
    try {
        // Получаем или создаем запись меню
        let menu = await prisma.menu.findFirst()
        if (!menu) {
            menu = await prisma.menu.create({
                data: {}
            })
        }

        // Получаем все активные позиции
        const items = await prisma.menuItem.findMany({
            where: { active: true },
            include: {
                types: true,
                tags: true
            },
            orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' }
            ]
        })

        // Сортируем: новинки/сезонное -> хиты -> по order
        const sortedItems = items.sort((a, b) => {
            const priorityA = getSortPriority(a)
            const priorityB = getSortPriority(b)

            if (priorityA !== priorityB) {
                return priorityA - priorityB
            }

            // Если приоритет одинаковый, сортируем по order
            return a.order - b.order
        })

        return reply.status(200).send({
            id: menu.id,
            updatedAt: menu.updatedAt,
            items: sortedItems
        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка получения меню' })
    }
}

export const updateMenuDate = async (request, reply) => {
    try {
        // Обновляем дату меню (создаем или обновляем запись)
        let menu = await prisma.menu.findFirst()
        if (!menu) {
            menu = await prisma.menu.create({
                data: {}
            })
        } else {
            menu = await prisma.menu.update({
                where: { id: menu.id },
                data: { updatedAt: new Date() }
            })
        }

        return reply.status(200).send({
            id: menu.id,
            updatedAt: menu.updatedAt
        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка обновления даты меню' })
    }
}

