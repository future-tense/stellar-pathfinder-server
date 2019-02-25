
import * as assets from './assets';
import * as log from './log';

// -----------------------------------------------------------------------------

import {
    OrderBook
} from './orderbook';

export type Arc = [
    string,
    number,
    OrderBook
];

export type Arcs = Arc[];

export type Graph = Map<string, Arcs>;

interface Offer {
    amount: number,
    price: number
}

// -----------------------------------------------------------------------------

/**
 *
 * @param offer
 * @return {*[]}
 */

export function toAssetPair(
    offer: any
): [string, string] {

    const destAsset = assets.toString(
        offer.sellingassettype,
        offer.sellingassetcode,
        offer.sellingissuer
    );

    const sourceAsset = assets.toString(
        offer.buyingassettype,
        offer.buyingassetcode,
        offer.buyingissuer
    );

    return [sourceAsset, destAsset];
}

/**
 *
 * @param offers
 */

export function setup(
    offers: any[]
) {
    const graph = {};
    const nodes = new Map<string, Arcs>();

    for (const offer of offers) {
        const [sourceAsset, destAsset] = toAssetPair(offer);

        let destNode = graph[destAsset];
        if (!destNode) {
            destNode = {};
            graph[destAsset] = destNode;
        }

        let arc = destNode[sourceAsset];
        if (!arc) {
            arc = [];
            destNode[sourceAsset] = arc;
        }

        arc.push(offer);
    }

    for (const [sourceAsset, node] of Object.entries(graph)) {

        const arcs: Arcs = [];
        for (const [destAsset, arc] of Object.entries(node)) {
            const orderBook = arc
                .sort(((a, b) => a.price - b.price))
                .map(offer => [Number(offer.amount), offer.price]);

            let capacity = 0;
            for (const [amount, price] of orderBook) {
                capacity += Number(amount);
            }

            arcs.push([destAsset, capacity, orderBook]);
        }

        nodes.set(sourceAsset, arcs);
    }

    return nodes;
}

/**
 *
 * @param graph
 * @param selling
 * @param buying
 * @param offers
 */

export function update(
    graph: Graph,
    selling: string,
    buying: string,
    offers: Offer[]
): void {

    let op;
    if (offers.length) {

        let capacity = 0;
        const orderBook: OrderBook = [];
        for (let {amount, price} of offers) {
            amount = Number(amount);
            orderBook.push([amount, price]);
            capacity += amount;
        }
        const arc: Arc = [buying, capacity, orderBook];

        const arcs = graph.get(selling);
        if (arcs) {
            const index = arcs.findIndex(([asset, ]) => (asset === buying));
            if (index !== -1) {
                arcs.splice(index, 1, arc);     //  arcs[index] = arc;
                op = 'UPDATE';
            } else {
                arcs.push(arc);
                op = 'CREATE';
            }
        } else {
            graph.set(selling, [arc]);
            op = 'CREATE';
        }
    }

    else {
        const arcs = graph.get(selling) as Arcs;
        const index = arcs.findIndex(([asset, ]) => (asset === buying));
        arcs.splice(index, 1);
        if (arcs.length === 0) {
            graph.delete(selling);
        }

        op = 'DELETE';
    }

    log.trace(`${op}: ${selling} / ${buying}`);
}
