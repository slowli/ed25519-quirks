import {
  Keypair, PublicKey, PublicKeyIter, RandomScalar, Signature,
} from '../wasm/pkg/ed25519_quirks';

PublicKeyIter.prototype[Symbol.iterator] = function iter() { return this; };
const SMALL_SUBGROUP = [...PublicKey.smallSubgroup()];

export default (Vue) => {
  // eslint-disable-next-line no-param-reassign
  Vue.prototype.$crypto = {
    Keypair,
    PublicKey,
    RandomScalar,
    Signature,
    SMALL_SUBGROUP,
  };
};
