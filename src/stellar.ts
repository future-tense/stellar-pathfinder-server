/* global process */

import { performance } from 'perf_hooks';
import { Client } from 'pg';
import * as pgNotify from '@becual/pg-notify';
import BigNumber from 'bignumber.js';

import * as graph from './graph';
import * as assets from './assets';
import * as pathFinder from './path-finder';
import * as log from './log';

// -----------------------------------------------------------------------------

import {
    AssetType
} from './assets';

import {
    Arcs,
    Graph
} from './graph';

type NativeAsset = {
    asset_type: 'native'
}

type CreditAsset = {
    asset_type: 'credit_alphanum4' | 'credit_alphanum12'
    asset_issuer: string,
    asset_code: string,
}

type Asset = NativeAsset | CreditAsset;

interface PathRecordSource {
    source_asset_type: string
    source_asset_issuer?: string,
    source_asset_code?: string,
    source_amount: string
}

interface PathRecordDestination {
    destination_asset_type: string
    destination_asset_issuer?: string,
    destination_asset_code?: string,
    destination_amount: string
}

interface PathRecord {
    source_asset_type: string
    source_asset_issuer?: string,
    source_asset_code?: string,
    source_amount: string
    destination_asset_type: string
    destination_asset_issuer?: string,
    destination_asset_code?: string,
    destination_amount: string
    path: Asset[]
}

// -----------------------------------------------------------------------------

let client;
let nodes;
let onLedger;
let currentLedger;
let previousLedger;
let readyResolve;
const modifiedPairs = new Set();

/**
 *  @return: Promise<Graph>
 */

const rebuildGraph = async (
): Promise<Graph> => {
    const res = await client.query('SELECT * from offers');
    return graph.setup(res.rows);
};

/**
 *
 * @private
 * @param selling
 * @param buying
 * @return {*}
 */

const buildQuery = (
    selling: string,
    buying: string
): {} => {

    const from = assets.toTuple(selling);
    const to = assets.toTuple(buying);

    if ((from[0] === AssetType.native) && (to[0] !== AssetType.native)) {
        return {
            text: 'SELECT amount, price FROM offers WHERE sellingassettype = \'0\' AND buyingassetcode = $1 AND buyingissuer = $2 ORDER BY price ASC',
            values: [to[1], to[2]]
        };
    }

    if ((from[0] !== AssetType.native) && (to[0] === AssetType.native)) {
        return {
            text: 'SELECT amount, price FROM offers WHERE sellingassetcode = $1 AND sellingissuer = $2 AND buyingassettype = \'0\' ORDER BY price ASC',
            values: [from[1], from[2]]
        };
    }

    return {
        text: 'SELECT amount, price FROM offers WHERE sellingassetcode = $1 AND sellingissuer = $2 AND buyingassetcode = $3 AND buyingissuer = $4 ORDER BY price ASC',
        values: [from[1], from[2], to[1], to[2]]
    };
};

/**
 *
 * @private
 * @return {Promise<void>}
 */

const onLedgerSetup = async (): Promise<void> => {

    log.info('Received first ledger');

    nodes = await rebuildGraph();
    onLedger = onLedgerUpdate;
    previousLedger = currentLedger;

    readyResolve();
};

/**
 *
 * @private
 * @return {Promise<void>}
 */

const onLedgerUpdate = async (): Promise<void> => {

    if (currentLedger === previousLedger + 1) {
        const pairs = Array.from(modifiedPairs);
        modifiedPairs.clear();

        log.debug(`Ledger #${currentLedger} - Pairs modified: ${pairs.length}`);

        const next: Graph = new Map<string, Arcs>(nodes);
        for (const pair of pairs) {
            const [buying, selling] = JSON.parse(pair);
            const query = buildQuery(selling, buying);
            const res = await client.query(query);
            graph.update(next, selling, buying, res.rows);
        }

        nodes = next;
    }

    else {
        nodes = await rebuildGraph();
        log.warn('Ledger(s) skipped. Increase TRIGGER_DELAY?');
        log.debug(`Ledger #${currentLedger} - Graph rebuilt from scratch`);
    }

    previousLedger = currentLedger;
};

let timer;
const triggerDelay = Number(process.env.TRIGGER_DELAY) || 5;

/**
 *
 * @private
 * @param evt
 */

const onTrigger = (evt): void => {
    if (evt.table === 'offers') {
        clearTimeout(timer);
        const pair = graph.toAssetPair(evt.data);
        modifiedPairs.add(JSON.stringify(pair));
        timer = setTimeout(onLedger, triggerDelay);
    }

    else if (evt.table === 'ledgerheaders') {
        currentLedger = evt.data.ledgerseq;
    }
};

/**
 * Return the different assets that an account is able to hold
 *
 * @private
 * @param account
 * @return {Promise<string[] | *>}
 */

const getAccountAssets = async (
    account: string
): Promise<string[]> => {

    const res = await client.query({
        text: 'SELECT issuer, assetcode FROM trustlines WHERE accountid = $1',
        values: [account]
    });

    const assets = res.rows.map((item) => `${item.issuer}:${item.assetcode}`);
    assets.push('native');

    return assets;
};

// -----------------------------------------------------------------------------

/**
 *
 * @return {Promise<*|undefined>}
 */

export async function init(
): Promise<void> {

    onLedger = onLedgerSetup;

    if (!process.env.STELLAR_CORE_DB) {
        log.fatal("'STELLAR_CORE_DB' not set");
        throw {};
    }

    client = new Client({
        connectionString: process.env.STELLAR_CORE_DB
    });

    try {
        await client.connect();
        log.info('Connected to stellar-core database');

        const sub = await pgNotify(client).subscribe(['offers', 'ledgerheaders']);
        sub.on('INSERT', onTrigger);
        sub.on('UPDATE', onTrigger);
        sub.on('DELETE', onTrigger);

        return new Promise((resolve, reject) => {
            readyResolve = resolve;
        });
    }

    catch (error) {
        log.fatal(error.message);
        await client.end();
        throw {};
    }
}

/**
 *
 * @param sourceAccount
 * @param destAsset
 * @param destAmount
 */

export async function findPaths(
    sourceAccount: string,
    destAsset: string,
    destAmount: string
): Promise<{}> {

    const targets = await getAccountAssets(sourceAccount);

    const t0 = performance.now();
    const paths = pathFinder.findPaths(
        nodes,
        targets,
        destAsset,
        Number(destAmount) * 1e7
    );
    const t1 = performance.now();
    log.debug('findPaths(): ', t1 - t0);

    const getDestRecord = (destAsset, destAmount) => {

        const dest: any = assets.stringToObject(destAsset, [
            'destination_asset_type',
            'destination_asset_code',
            'destination_asset_issuer'
        ]);

        dest.destination_amount = destAmount;

        return dest as PathRecordDestination;
    };

    const getSourceRecord = (sourceAsset) => {

        const source: any = assets.stringToObject(sourceAsset, [
            'source_asset_type',
            'source_asset_code',
            'source_asset_issuer'
        ]);

        return source as PathRecordSource;
    };

    const convertPrice = (price: number) =>
        new BigNumber(price)
            .dividedBy(1e7)
            .toFixed(7);

    const destRecord = getDestRecord(destAsset, destAmount);

    const records: Array<PathRecord> = [];
    for (const key of Object.keys(paths)) {

        const sourceRecord = getSourceRecord(key);
        for (const [price, pathAssets] of paths[key]) {

            const path = pathAssets.map((item) =>
                assets.stringToObject(item, [
                    'asset_type',
                    'asset_code',
                    'asset_issuer'
                ])
            );

            const record: PathRecord = Object.assign({
                    path,
                    source_amount: convertPrice(price)
                },
                sourceRecord,
                destRecord
            );

            records.push(record);
        }
    }

    return {
        '_embedded': {
            'records': records
        }
    };
}
