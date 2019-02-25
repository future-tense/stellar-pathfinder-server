
type Order = [number, number];
export type OrderBook = Order[];

/**
 *
 * @param orderBook
 * @param amountToBuy
 * @return {number}
 */

export function buy(
    orderBook: OrderBook,
    amountToBuy: number
): number {

    let amountToSell = 0;
    for (const [amount, price] of orderBook) {
        if (amountToBuy > amount) {
            amountToSell += amount * price;
            amountToBuy  -= amount;
        } else {
            amountToSell += amountToBuy * price;
            break;
        }
    }

    return amountToSell;
}

/**
 *
 * @param orderBook
 * @param amountToSell
 * @return {number}
 */

export function sell(
    orderBook: OrderBook,
    amountToSell: number
): number {

    let amountToBuy = 0;
    for (const [amount, price] of orderBook) {
        if (amountToSell > amount * price) {
            amountToBuy  += amount;
            amountToSell -= amount * price;
        } else {
            amountToBuy  += amountToSell / price;
            break;
        }
    }

    return amountToBuy;
}
