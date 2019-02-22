
import * as StellarSdk from 'stellar-sdk';
import * as express from 'express';

import * as stellar from './stellar';
import * as log from './log';

// -----------------------------------------------------------------------------

const validateAmount = (amount) => {
    return (
        amount &&
        !isNaN(amount) &&
        (Number(amount) >= 0)
    );
};

const validateAddress = (source) => {
    return (
        source && StellarSdk.StrKey.isValidEd25519PublicKey(source)
    );
};

const validateType = (type) => {
    return (
        type &&
        ['native', 'credit_alphanum4', 'credit_alphanum12'].includes(type)
    );
};

const validateCode = (code, type) => {
    return (
        code &&
        ((type === 'credit_alphanum4') ? (code.length <= 4) : true)
    );
};

const validateQuery = (q) => {

    if (!validateAmount(q.destination_amount)) {
        throw {
            'invalid_field': 'destination_amount',
            'reason': 'Value must be positive'
        };
    }

    if (!validateAddress(q.source_account)) {
        throw {
            'invalid_field': 'source_account',
            'reason': 'invalid address'
        };
    }

    if (!validateType(q.destination_asset_type)) {
        throw {
            'invalid_field': 'destination_asset_type',
            'reason': "invalid asset type: was not one of 'native', 'credit_alphanum4', 'credit_alphanum12'"
        };
    }

    if (q.destination_asset_type === 'native') {
        return;
    }

    if (!validateAddress(q.destination_asset_issuer)) {
        throw {
            'invalid_field': 'destination_asset_issuer',
            'reason': 'invalid address'
        };
    }

    if (!validateCode(q.destination_asset_code, q.destination_asset_type)) {
        throw {
            'invalid_field': 'destination_asset_code',
            'reason': 'code too long'
        };
    }
};

/**
 *
 * @private
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const findPaths = async (req, res) => {

    try {
        validateQuery(req.query);

        const {
            source_account: source,
            destination_amount: amount,
            destination_asset_type: type,
            destination_asset_issuer: issuer,
            destination_asset_code: code,
        } = req.query;

        const destAsset = (type === 'native') ? 'native' : `${issuer}:${code}`;
        const paths = await stellar.findPaths(source, destAsset, amount);

        res.json(paths);
        res.status(200).end();
    }

    catch (e) {

        const error = {
            'type': 'https://stellar.org/horizon-errors/bad_request',
            'title': 'Bad Request',
            'status': 400,
            'detail': 'The request you sent was invalid in some way',
            'extras': e
        };

        res.json(error);
        res.status(400).end();
    }
};

// -----------------------------------------------------------------------------

/**
 *
 * @return {Promise<void>}
 */

export async function init() {

    const port = process.env.API_PORT || 8000;
    const prefix = process.env.API_PREFIX || '';

    const app = express();
    app.set('json spaces', 4);
    app.get(`${prefix}/paths`, findPaths);

    try {
        app.listen(port);
        log.info(`Listening to port ${port}`);
    } catch (error) {
        log.fatal(error.message);
    }
}
