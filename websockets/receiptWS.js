import { WebSocketServer } from 'ws'

export const receiptWSS = new WebSocketServer({ noServer: true })

export function setupReceiptWS(server) {
    server.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws/receipts') { // фильтр по пути
            receiptWSS.handleUpgrade(request, socket, head, (ws) => {
                receiptWSS.emit('connection', ws, request)
            })
        }
    })

    receiptWSS.on('connection', (ws) => {
        console.log('⚡ Клиент подключился к WS чеков')
        ws.send(JSON.stringify({ type: 'connected' }));
        ws.on('close', () => {
            console.log('❌ Клиент отключился от WS чеков')
        })
    })
}

// Функция для отправки новых чеков всем клиентам
export function sendSocketReceipt(receipts) {
    console.log('Sending receipts:', receipts); // <- проверь тут
    const data = JSON.stringify({ type: 'new_receipts', payload: receipts })
    receiptWSS.clients.forEach(client => {
        console.log(client);

        if (client.readyState === 1) client.send(data) // ✅ client, а не ws
    })
}

