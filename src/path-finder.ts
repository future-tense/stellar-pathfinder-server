
// -----------------------------------------------------------------------------

import {
    Graph,
    OrderBook
} from './graph';

const enum Constants {
    maxLengthMinusOne = 7 - 1
}

// -----------------------------------------------------------------------------

/**
 *
 * @param amountToSell
 * @param orderBook
 * @return {number}
 */

const tradeSell = (
    amountToSell: number,
    orderBook: OrderBook
): number => {

    let amountToBuy = 0;
    for (const [amount, price] of orderBook) {
        if (amountToSell > amount) {
            amountToBuy  += amount * price;
            amountToSell -= amount;
        } else {
            amountToBuy  += amountToSell * price;
            break;
        }
    }

    return amountToBuy;
};

// -----------------------------------------------------------------------------

/**
 *
 * @param graph
 * @param targetAssets
 * @param destAsset
 * @param destAmount
 */

export function findPaths(
    graph: Graph,
    targetAssets: string[],
    destAsset: string,
    destAmount: number
) {

    //
    //  take a short-cut if we're trying to find a path from ['native'] to 'native':
    //

    if ((destAsset === 'native') && (targetAssets.length === 1)) {
        return {
            'native': [
                [destAmount, []]
            ]
        };
    }

    //
    //  the lowest cost so far for a path going from an asset to `destAsset`
    //

    const lowestCost = new Map<string, number>();

    const paths = {};
    for (const asset of targetAssets) {
        paths[asset] = [];
    }

    const path: string[] = [];
    const find = (sourceAsset: string, amountIn: number) => {

        if (path.includes(sourceAsset)) {
            return;
        }

        //
        //  if we get to an a point where we've come to in a previous path
        //  and that path has a lower cost than this one, then there's no point
        //  in traversing any further
        //

        const cost = lowestCost.get(sourceAsset);
        if (!cost || (amountIn < cost)) {
            lowestCost.set(sourceAsset, amountIn);
        } else {
            return;
        }

        //
        //  if the current asset is one of our target assets,
        //  store away the path we've taken to get here
        //

        if (sourceAsset in paths) {
            paths[sourceAsset].push([amountIn, path.slice(1).reverse()]);
        }

        //
        //  if we're at the maximum path length (`path` + `sourceAsset`),
        //  stop searching
        //

        if (path.length === Constants.maxLengthMinusOne) {
            return;
        }

        //
        //  fan out
        //


        const arcs = graph.get(sourceAsset);
        if (arcs) {
            path.push(sourceAsset);
            for (const [destAsset, capacity, orderBook] of arcs) {
                if (capacity >= amountIn) {
                    const amountOut = tradeSell(amountIn, orderBook);
                    find(destAsset, amountOut);
                }
            }
            path.pop();
        }
    };

    find(destAsset, destAmount);

    return paths;
}
