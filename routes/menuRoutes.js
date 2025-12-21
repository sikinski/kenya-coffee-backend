import {
    // Types
    getMenuItemTypes,
    createMenuItemType,
    updateMenuItemType,
    deleteMenuItemType,
    // Tags
    getMenuTags,
    createMenuTag,
    updateMenuTag,
    deleteMenuTag,
    // Items
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    updateMenuItemsOrder,
    deleteMenuItem,
    // Menu
    getMenu,
    updateMenuDate
} from '../controllers/menuController.js'
import { uploadImage } from '../controllers/imageController.js'

export default async function (fastify) {
    // ========== TYPES (Типы позиций) ==========
    fastify.get('/menu/types', getMenuItemTypes) // Публичный доступ
    fastify.post('/menu/types', { preHandler: [fastify.authenticate] }, createMenuItemType)
    fastify.put('/menu/types/:id', { preHandler: [fastify.authenticate] }, updateMenuItemType)
    fastify.delete('/menu/types/:id', { preHandler: [fastify.authenticate] }, deleteMenuItemType)

    // ========== TAGS (Теги) ==========
    fastify.get('/menu/tags', getMenuTags) // Публичный доступ
    fastify.post('/menu/tags', { preHandler: [fastify.authenticate] }, createMenuTag)
    fastify.put('/menu/tags/:id', { preHandler: [fastify.authenticate] }, updateMenuTag)
    fastify.delete('/menu/tags/:id', { preHandler: [fastify.authenticate] }, deleteMenuTag)

    // ========== ITEMS (Позиции меню) ==========
    fastify.get('/menu/items', { preHandler: [fastify.optionalAuthenticate] }, getMenuItems) // Публичный доступ, но проверяем токен для фильтрации
    fastify.get('/menu/items/:id', getMenuItem) // Публичный доступ
    fastify.post('/menu/items', { preHandler: [fastify.authenticate] }, createMenuItem)
    fastify.put('/menu/items/:id', { preHandler: [fastify.authenticate] }, updateMenuItem)
    fastify.put('/menu/items/order', { preHandler: [fastify.authenticate] }, updateMenuItemsOrder) // Массовое обновление order
    fastify.delete('/menu/items/:id', { preHandler: [fastify.authenticate] }, deleteMenuItem)

    // ========== MENU (Актуальное меню) ==========
    fastify.get('/menu', { preHandler: [fastify.optionalAuthenticate] }, getMenu) // Публичный доступ, но проверяем токен для фильтрации
    fastify.put('/menu/update-date', { preHandler: [fastify.authenticate] }, updateMenuDate)

    // ========== IMAGES (Загрузка изображений) ==========
    fastify.post('/images', { preHandler: [fastify.authenticate] }, uploadImage)
}

