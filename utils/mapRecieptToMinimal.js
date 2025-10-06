export function mapRowToMinimal(row) {
    const cashierName = row.cashier?.name || 'Неизвестно';

    let discount = '';
    if (row.content?.discountMoney > 0) discount = `${row.content.discountMoney}р`;
    else if (row.content?.discountPercent > 0) discount = `${row.content.discountPercent}%`;

    return {
        id: row.id,
        cashier_name: cashierName,
        discount,
        type: row.content?.type,
        customerInfo: row.content?.customerInfo || null,
        positions: row.content?.positions || [],
        amount: row.amount,
        calculationAddress: row.calculationAddress || row.content?.settlementAddress || '',
        processedAt: row.processedAt,
    };
}