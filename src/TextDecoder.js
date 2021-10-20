/*
 * Extra-cheap polyfill for `TextDecoder` used in `wasm-bindgen`-generated code
 * and absent in older Edge versions. Using a `text-encoding` package for this purpose
 * bloats the app a couple of times, hence this hacky solution.
 */

import { Buffer } from 'buffer';

export default global.TextDecoder || class {
  constructor(encoding) {
    if (encoding !== 'utf-8') {
      throw new TypeError('Unsupported encoding');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  decode(buffer) {
    return Buffer.from(buffer).toString('utf8');
  }
};
