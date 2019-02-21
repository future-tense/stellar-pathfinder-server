#!/usr/bin/env node

const stellar = require("../dist/stellar");
const rest = require("../dist/rest");

(async () => {
    try {
        await stellar.init();
        await rest.init();
    }
    catch (e) {
    }
})();
