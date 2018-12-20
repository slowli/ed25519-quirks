<template>
  <div>
    <p class="lead">Now, the fun part begins: attempting to break Ed25519 in various ways. Our first approach is
      <a href="https://en.wikipedia.org/wiki/Malleability_(cryptography)">malleability</a>, the ability to create
      digital signatures without the knowledge of the necessary secret key.</p>

    <p>Contrary to a threatening definition, malleability doesn’t break a digital signature scheme. It allows to create
      new digital signatures for messages <em>already</em> signed by the legitimate message signers, rather than for
      new messages (which would indeed break signature scheme security).
      In application to Ed25519, the malleability attack is as follows: given a valid signature <code>(R, s)</code>
      under the message <code>M</code> and the public key <code>A</code>, produce another signature
      <code>(R′, s′) != (R, s)</code>
      such that it would verify for <code>M</code> and <code>A</code>.</p>
    <p>Although malleability is not a problem for signing, things can get ugly if a system
      accepting digitally signed messages assumes that every signature
      is created by the owner of a respective secret key. For example, the system may identify messages by their
      cryptographic hash computed from the message together with the signature (as it was the case with Bitcoin
      before <a href="https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki">SegWit</a>). In this case,
      the same message signed by two different signatures will have
      different hashes and thus will be treated as two separate entities! This was a significant obstacle for
      implementing chained payments, e.g., for <a href="https://lightning.network/">Lightning Network</a>,
      in Bitcoin pre-SegWit.</p>

    <h3>Mutating signature scalar</h3>
    <p>Some Ed25519 implementations verify that signature scalar <code>s &lt; 2<sup>253</sup></code>,
      rather than comparing it to the subgroup order <code>ℓ</code>. The problem is,
      for most valid scalars <code>s</code>,
      <code>s + ℓ &lt; 2<sup>253</sup></code> as well; thus, <code>(R, s + ℓ)</code> is considered a valid signature.
      Since <code>2ℓ > 2<sup>253</sup></code>, using <code>s + 2ℓ</code>, <code>s + 3ℓ</code>, etc.
      as a scalar component of the signature will always fail.</p>

    <form>
      <seed v-model="keypair" :encoding="encoding"></seed>
      <div class="form-row mb-3">
        <label for="message" class="col-md-3 col-lg-2 col-form-label">Message <code>M</code></label>
        <div class="col-md-9 col-lg-10">
          <input id="message" class="form-control" placeholder="Signed message" v-model="message" />
        </div>
      </div>
    </form>

    <data-row name="Public key" :data="repr(keypair.publicKey().bytes())" wrapper='A = Pt("$")'></data-row>
    <data-row name="Signature" :data="repr(signature.bytes())" wrapper='(R, s) = "$"'></data-row>
    <data-row name="Signature scalar" :data="repr(signature.scalar())" wrapper='s = Sc("$")'></data-row>
    <data-row name="Modified scalar" :data="repr(modifiedScalar.bytes())" wrapper='s′ = s + ℓ = Sc("$")'></data-row>
    <data-row name="New signature" :data="repr(modifiedScalar.signature())">
      <status slot="key" :status="modifiedScalar.valid() ? 'ok' : 'fail'" />
    </data-row>

    <p class="mt-3">You can plug the message, public key and the new signature into
      <router-link target="_blank" :to="{ name: 'basics', hash: '#verification' }">verification form</router-link>
      or <a target="_blank" href="https://tweetnacl.js.org/#/sign">an external website</a> and check
      that the new signature is actually valid.</p>

    <h3>Fiddling with Randomness</h3>
    <p>It is impossible for an external party to mutate the <code>R</code> part of a signature, as it is included
      both into the hash scalar and in free form. The <em>owner</em> of the secret key can, however, trivially
      create as many signatures for the same content as he wishes. Indeed, it’s impossible to tell during
      signature verification if the point <code>R = [r]B</code>
      was created properly; rather than producing the scalar <code>r</code> from the secret key and
      the message, it can be set to any possible scalar.</p>

    <data-row name="Message" :data="message" wrapper="$">Copied from the previous example together
      with the keypair.</data-row>
    <data-row name="Public key" :data="repr(keypair.publicKey().bytes())" wrapper='A = Pt("$")'></data-row>
    <data-row name="Random scalar" :data="repr(randomizedSignature.randomScalar())" wrapper='r = Sc("$")'>
      <a slot="key" href="#" role="button" @click.prevent="generateScalar()"><i class="fas fa-dice"></i></a>
    </data-row>
    <data-row name="New signature" :data="repr(randomizedSignature.bytes())"></data-row>

    <p class="mt-3">If you search for a cryptographic primitive that provides
      a “unique” analogue of digital signatures, it does exist and is called
      <a href="https://en.wikipedia.org/wiki/Verifiable_random_function"><em>verifiable random function</em></a> (VRF);
      there is <a href="https://signal.org/docs/specifications/xeddsa/#vxeddsa">a VRF implementation
        based on Curve25519</a> as well.</p>
  </div>
</template>
<script>
  import DataRow from '../components/DataRow.vue';
  import Seed from '../components/Seed.vue';
  import Status from '../components/Status.vue';
  import withEncoding from '../mixins/withEncoding';

  export default {
    mixins: [withEncoding],
    components: { DataRow, Seed, Status },

    data() {
      const keypair = new this.$crypto.Keypair();
      const message = 'Hello, world!';

      return {
        keypair,
        message,
        randomScalar: new this.$crypto.RandomScalar()
      }
    },

    computed: {
      signature() {
        const binaryMessage = this.$Buffer.from(this.message, 'utf8');
        return this.keypair.sign(binaryMessage);
      },

      randomizedSignature() {
        const binaryMessage = this.$Buffer.from(this.message, 'utf8');
        return this.keypair.signWithScalar(binaryMessage, this.randomScalar);
      },

      modifiedScalar() {
        return this.signature.modifiedScalar();
      }
    },

    methods: {
      generateScalar() {
        this.randomScalar = new this.$crypto.RandomScalar();
      }
    }
  };
</script>
