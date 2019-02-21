
import * as stellar from './stellar';
import * as rest from './rest';

(async () => {
    try {
        await stellar.init();
        await rest.init();
    } catch (e) {
    }
})();
