import { processImage } from '../utils/imageProcessor.js'

export const uploadImage = async (request, reply) => {
    try {
        const parts = request.parts()
        let imageBuffer = null

        for await (const part of parts) {
            if (part.type === 'file') {
                const chunks = []
                for await (const chunk of part.file) {
                    chunks.push(chunk)
                }
                imageBuffer = Buffer.concat(chunks)
                break // берем первый файл
            }
        }

        if (!imageBuffer) {
            return reply.status(400).send({ error: 'Необходимо загрузить изображение' })
        }

        // Обрабатываем изображение
        const filename = `image_${Date.now()}`
        const images = await processImage(imageBuffer, filename)

        return reply.status(200).send({
            original: images.original,
            thumbnail: images.thumbnail
        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Ошибка загрузки изображения' })
    }
}

