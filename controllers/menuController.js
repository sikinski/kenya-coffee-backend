import prisma from '../config/db.js'
import { deleteImages } from '../utils/imageProcessor.js'

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
        const { name, description, order } = request.body

        if (!name || !name.trim()) {
            return reply.status(400).send({ error: 'Название типа обязательно' })
        }

        const type = await prisma.menuItemType.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
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
        const { name, description, order } = request.body

        const type = await prisma.menuItemType.findUnique({ where: { id: Number(id) } })
        if (!type) {
            return reply.status(404).send({ error: 'Тип не найден' })
        }

        const updateData = {}
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (order !== undefined) updateData.order = Number(order)

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
        const { name, color, category } = request.body

        if (!name || !name.trim()) {
            return reply.status(400).send({ error: 'Название тега обязательно' })
        }

        const tag = await prisma.menuTag.create({
            data: {
                name: name.trim(),
                color: color?.trim() || null,
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
        const { name, color, category } = request.body

        const tag = await prisma.menuTag.findUnique({ where: { id: Number(id) } })
        if (!tag) {
            return reply.status(404).send({ error: 'Тег не найден' })
        }

        const updateData = {}
        if (name !== undefined) updateData.name = name.trim()
        if (color !== undefined) updateData.color = color?.trim() || null
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
            imageOriginal,
            imageThumbnail
        } = request.body

        if (!name || !price || !typeIds) {
            return reply.status(400).send({
                error: 'Поля name, price и typeIds обязательны'
            })
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

        const item = await prisma.menuItem.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                price: Number(price),
                discountPrice: discountPrice ? Number(discountPrice) : null,
                quantity: quantity ? Number(quantity) : null,
                volume: volume?.trim() || null,
                order: itemOrder,
                imageOriginal: imageOriginal?.trim() || null,
                imageThumbnail: imageThumbnail?.trim() || null,
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
            imageOriginal,
            imageThumbnail,
            deleteImage
        } = request.body

        const updateData = {}
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (price !== undefined) updateData.price = Number(price)
        if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? Number(discountPrice) : null
        if (quantity !== undefined) updateData.quantity = quantity ? Number(quantity) : null
        if (volume !== undefined) updateData.volume = volume?.trim() || null
        if (active !== undefined) updateData.active = active === 'true' || active === true

        // Обработка изображений
        if (deleteImage === true || deleteImage === 'true') {
            // Удаляем старые изображения
            if (item.imageOriginal || item.imageThumbnail) {
                await deleteImages(item.imageOriginal, item.imageThumbnail)
            }
            updateData.imageOriginal = null
            updateData.imageThumbnail = null
        } else if (imageOriginal !== undefined || imageThumbnail !== undefined) {
            // Если переданы новые URL изображений, удаляем старые (если они были)
            if ((imageOriginal !== undefined && imageOriginal !== item.imageOriginal) ||
                (imageThumbnail !== undefined && imageThumbnail !== item.imageThumbnail)) {
                // Удаляем старые изображения только если новые отличаются
                if (item.imageOriginal || item.imageThumbnail) {
                    await deleteImages(item.imageOriginal, item.imageThumbnail)
                }
            }
            // Устанавливаем новые URL
            if (imageOriginal !== undefined) updateData.imageOriginal = imageOriginal?.trim() || null
            if (imageThumbnail !== undefined) updateData.imageThumbnail = imageThumbnail?.trim() || null
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

        // Удаляем изображения
        if (item.imageOriginal || item.imageThumbnail) {
            await deleteImages(item.imageOriginal, item.imageThumbnail)
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

