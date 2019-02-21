
// -----------------------------------------------------------------------------

export const enum AssetType {
    native = 0,
    credit_alphanum4 = 1,
    credit_alphanum12 = 2
}

type AssetTupleNative = [AssetType.native, undefined, undefined]
type AssetTupleCredit = [AssetType.credit_alphanum4 | AssetType.credit_alphanum12, string, string];
type AssetTuple = AssetTupleNative | AssetTupleCredit;

// -----------------------------------------------------------------------------

/**
 *
 * @param t
 * @return {*[]}
 */

export function toTuple(
    t: string
) : AssetTuple {
    if (t === 'native') {
        return [AssetType.native, undefined, undefined];
    } else {
        const issuer = t.slice(0, 56);
        const code = t.slice(57);
        const type = code.length > 4? AssetType.credit_alphanum12 : AssetType.credit_alphanum4;
        return [type, code, issuer];
    }
}

/**
 *
 * @param asset
 * @param propNames
 */

export function stringToObject(
    asset: string,
    propNames: string[]
): object {
    const typeNames = {
        0: 'native',
        1: 'credit_alphanum4',
        2: 'credit_alphanum12'
    };

    const res = {};
    const [typeProp, codeProp, issuerProp] = propNames;
    const [type, code, issuer] = toTuple(asset);
    if (type === 0) {
        res[typeProp] = asset;
    } else {
        res[typeProp] = typeNames[type];
        res[codeProp] = code;
        res[issuerProp] = issuer;
    }

    return res;
}

/**
 *
 * @param type
 * @param code
 * @param issuer
 * @return {string}
 */

export function toString(
    type: number,
    code: string | undefined,
    issuer: string | undefined
): string {
    return (type !== 0) ? `${issuer}:${code}` : 'native';
}
