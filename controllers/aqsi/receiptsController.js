import axios from 'axios'
import qs from 'qs';

export const getReceipts = async (request, reply) => {
    const queryString = qs.stringify(request.query, { encode: true });

    try {
        const AQSI_URL = process.env.AQSI_URL
        const AQSI_KEY = process.env.AQSI_KEY


        const response = await axios.get(`${AQSI_URL}/v2/Receipts?${queryString}`, {
            headers: {
                'x-client-key': `Application ${AQSI_KEY}`
            }
        })

        return reply.status(200).send(response.data)
    } catch (err) {
        console.error(err.response)
        return reply.status(500).send("Ошибка при обращении к Aqsi:", err?.response?.data || err?.response?.status || err.message)
    }
}