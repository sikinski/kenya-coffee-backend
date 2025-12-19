import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const ORIGINAL_DIR = path.join(UPLOAD_DIR, 'original')
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnail')

// Создаем директории, если их нет
async function ensureDirectories() {
    await fs.mkdir(ORIGINAL_DIR, { recursive: true })
    await fs.mkdir(THUMBNAIL_DIR, { recursive: true })
}

/**
 * Обрабатывает и сохраняет изображение
 * @param {Buffer} imageBuffer - буфер изображения
 * @param {string} filename - имя файла (без расширения)
 * @returns {Promise<{original: string, thumbnail: string}>} - пути к сохраненным файлам
 */
export async function processImage(imageBuffer, filename) {
    await ensureDirectories()

    const timestamp = Date.now()
    const originalFilename = `${filename}_${timestamp}.jpg`
    const thumbnailFilename = `${filename}_${timestamp}_thumb.jpg`

    const originalPath = path.join(ORIGINAL_DIR, originalFilename)
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename)

    // Сохраняем оригинал (максимальная ширина 1920px, качество 90%)
    await sharp(imageBuffer)
        .resize(1920, null, {
            withoutEnlargement: true,
            fit: 'inside'
        })
        .jpeg({ quality: 90 })
        .toFile(originalPath)

    // Создаем миниатюру (ширина 400px, качество 80%)
    await sharp(imageBuffer)
        .resize(400, null, {
            withoutEnlargement: true,
            fit: 'inside'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath)

    return {
        original: `/uploads/original/${originalFilename}`,
        thumbnail: `/uploads/thumbnail/${thumbnailFilename}`
    }
}

/**
 * Удаляет изображения
 * @param {string} originalPath - путь к оригиналу
 * @param {string} thumbnailPath - путь к миниатюре
 */
export async function deleteImages(originalPath, thumbnailPath) {
    try {
        if (originalPath) {
            const fullPath = path.join(__dirname, '..', originalPath)
            await fs.unlink(fullPath).catch(() => { }) // игнорируем ошибки, если файл не существует
        }
        if (thumbnailPath) {
            const fullPath = path.join(__dirname, '..', thumbnailPath)
            await fs.unlink(fullPath).catch(() => { })
        }
    } catch (err) {
        console.error('Ошибка при удалении изображений:', err)
    }
}

