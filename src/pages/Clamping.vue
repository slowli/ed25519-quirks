<template>
  <div>
    <p class="lead">
      Why is the scalar component of the secret key in Ed25519 clamped as specified?
    </p>

    <p>’Cause security, obviously.</p>
    <blockquote class="blockquote">
      <!-- tfw you create a website with a single image -->
      <img
        src="https://tfw.ostrov.ski"
        class="img-fluid"
        alt="tfw you understand Ed25519 key clamping"
        title="It’s that easy"
      >
    </blockquote>

    <p>
      For realsies, tho: clamping breaks the linear relation between secret and public keys, so stuff like
      <a href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki">hierarchical key derivation</a>
      or plain outsourced vanity address grinding becomes difficult compared to cryptosystems
      with such a relationship (e.g., the secp256k1 elliptic curve with either ECDSA or Schnorr).
      In some cases, the damage is irreparable: as clamping leaves space for just <code>2<sup>251</sup></code>
      secret scalars as opposed to <code>ℓ = 2<sup>252</sup> + …</code> possibilities, arithmetic on public keys
      that would map to secret keys is impossible. It is relatively easy to get rid of restrictions by not clamping
      secret scalars, but there must be <em>some</em> reasons they’re clamped, right?
    </p>
    <p>
      For real realsies, setting one of higher bits to one <em>sort of</em> makes sense;
      <a href="https://moderncrypto.org/mail-archive/curves/2017/000860.html">it enables to not allow
      for the zero scalar</a> during signature generation.
      Setting lower 3 bits to zero
      <a href="https://moderncrypto.org/mail-archive/curves/2017/000861.html"><em>might</em> protect</a>
      against extracting the secret key by solving
      a fitting <a href="http://www.isg.rhul.ac.uk/~sdg/igor-slides.pdf">hidden number problem</a>
      (which were shown to be an effective attack vector for other cryptosystems, e.g., ECDSA).
    </p>

    <!-- eslint-disable max-len -->
    <p class="small">
      Alternatively, setting lower bits is supposed to protect against
      <a href="https://crypto.stackexchange.com/questions/55632/libsodium-x25519-and-ed25519-small-order-check/55643#55643">small-subgroup
      attacks</a>, but how these attacks are relevant to signing is a good question (as opposed to key exchange,
      where small-subgroup attacks make complete sense).
    </p>
    <!-- eslint-enable max-len -->
  </div>
</template>
