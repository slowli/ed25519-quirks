const {
  Keypair, PublicKey, PublicKeyIter, RandomScalar, Signature,
} = await import(/* webpackChunkName: "bundle" */ '../wasm/pkg');

PublicKeyIter.prototype[Symbol.iterator] = function iter() { return this; };
const SMALL_SUBGROUP = [...PublicKey.smallSubgroup()];

export {
  Keypair,
  PublicKey,
  RandomScalar,
  Signature,
  SMALL_SUBGROUP,
};
