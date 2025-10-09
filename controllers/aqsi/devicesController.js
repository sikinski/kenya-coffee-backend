import axios from 'axios'

export const getDevices = async (request, reply) => {
    try {
        const AQSI_URL = process.env.AQSI_URL
        const AQSI_KEY = process.env.AQSI_KEY

        const response = await axios.get(`${AQSI_URL}/v3/Devices`, {
            headers: {
                'x-client-key': `Application ${AQSI_KEY}`
            }
        })

        return reply.status(200).send(response.data)

    } catch (err) {
        return reply.status(500).send("Ошибка при обращении к Aqsi:", err?.response?.data || err.message)
    }
}


export const getShopByID = async (request, reply) => {
    const { id } = request.params

    if (!id) {
        return reply.status(400).send('Параметр ID обязателен')
    }

    try {
        const AQSI_KEY = process.env.AQSI_KEY
        const AQSI_URL = process.env.AQSI_URL

        const response = await axios.get(`${AQSI_URL}/v2/Shops/${id}`, {
            headers: {
                'x-client-key': `Application ${AQSI_KEY}`
            }
        })

        return reply.status(200).send(response.data)

    } catch (err) {
        console.error(err);
        return reply.status(500).send("Ошибка получения данных магазина", err?.response?.data || err.message)
    }
}