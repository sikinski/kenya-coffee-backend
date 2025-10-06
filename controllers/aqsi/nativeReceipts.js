// import axios from 'axios'
// import prisma from '../../config/db.js'

// export const getNative = async (request, reply) => {
//     try {
//         const AQSI_URL = process.env.AQSI_URL
//         const AQSI_KEY = process.env.AQSI_KEY

//         const queryString = `?page=1&pageSize=10&filtered.beginDate=2025-10-06T00:00:00&sorted.id=${JSON.stringify([{ id: 'processedAt', desc: false }])}`


//         console.log(queryString);

//         const response = await axios.get(`${AQSI_URL}/v2/Receipts${queryString}`, {
//             headers: { 'x-client-key': `Application ${AQSI_KEY}` }
//         })

//         await prisma.nativeReceipt.deleteMany() // чтоб база обновлялась, чтоб я видела актуальные моему коду результаты

//         await prisma.nativeReceipt.createMany({
//             data: response.data.rows.map(r => ({ raw: r }))
//         });

//         return reply.status(200).send(response.data)
//     } catch (err) {
//         console.error(err.response?.data || err.message)
//         return reply.status(500).send("Ошибка при обращении к Aqsi")
//     }
// }


import prisma from '../../config/db.js'

export const getNative = async (request, reply) => {
    try {
        // const receipts = await prisma.nativeReceipt.findMany({
        //     skip: 0,
        //     take: 10,
        //     orderBy: {
        //         raw: {
        //             processedAt: 'desc',
        //         },
        //     },
        // });
        const receipts = await prisma.nativeReceipt.findMany({
            orderBy: { processedAt: 'desc' },
            take: 10,
        });




        // Если нужно вернуть именно данные чеков, а не весь объект с оберткой:
        // const formatted = receipts.map(r => r.raw);

        return reply.status(200).send(receipts);
    } catch (err) {
        console.error(err);
        return reply.status(500).send("Ошибка при получении чеков из базы");
    }
}
