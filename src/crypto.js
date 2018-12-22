import {
  Keypair, PublicKey, RandomScalar, Signature,
} from '../wasm/pkg/ed25519_quirks';

const SMALL_SUBGROUP = (() => {
  const iter = PublicKey.smallSubgroup();
  const smallSubgroup = [];
  for (let next = iter.next(); ; next = iter.next()) {
    if (next.done()) {
      break;
    } else {
      smallSubgroup.push(next.value());
    }
  }
  return smallSubgroup;
})();

export default function (Vue) {
  // eslint-disable-next-line no-param-reassign
  Vue.prototype.$crypto = {
    Keypair,
    PublicKey,
    RandomScalar,
    Signature,
    SMALL_SUBGROUP,
  };
}
