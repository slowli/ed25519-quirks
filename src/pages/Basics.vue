<template>
  <div>
    <p class="lead">As with other digital signature schemes, Ed25519 consists of three protocols: key generation,
      signing and verification. They are similar, but distinct, from the generic Schnorr scheme.</p>

    <h3 id="generation">Key Generation</h3>
    <p>Ed25519 does not match secret keys to scalars.
      Instead, a secret scalar is generated from a <em>seed</em>, a 32-byte string, which should be filled at random
      from a cryptographically secure RNG.</p>

    <form class="mb-3">
      <seed v-model="keypair" :encoding="encoding"></seed>
    </form>

    <data-row name="Expanded seed" :data="repr(keypair.expandedSeed())" wrapper='xseed = Hash(seed) = "$"'>
      The seed is expanded to 64 bytes with the help of a hash function.
      Most Ed25519 implementations use SHA-512, but any cryptographic hash function with 64-byte output can suffice.
    </data-row>
    <data-row name="Secret scalar" :data="repr(keypair.scalar())" wrapper='a = Sc(clamp(xseed[..32])) = Sc("$")'>
      The first 32 bytes are “clamped” by setting
      the lower 3 bits and the highest bit (in the LSB interpretation) to 0, and the second-highest bit to 1.
      The resulting byte sequence is interpreted as a scalar <code>a</code>.
    </data-row>
    <data-row name="Nonce" :data="repr(keypair.nonce())" wrapper='nonce = xseed[32..] = "$"'>
      The upper 32 bytes of the expanded seed are used as a <em>nonce</em> during signing.
    </data-row>
    <data-row name="Public key" :data="repr(keypair.publicKey().bytes())" wrapper='A = [a]B = Pt("$")'>
      The public key is still (the encoding of) a point on the elliptic curve, obtained by multiplying
      the basepoint <code>B</code> by the secret scalar.
    </data-row>

    <p>If you want to know why the secret scalar is clamped in this way, refer to
      <router-link :to="{ name: 'clamping' }">this explanation</router-link>.</p>

    <h3 id="signing">Signing</h3>
    <p>Signing in Ed25519 is deterministic: it doesn't require an RNG during signing. A faulty RNG during signing
      can leak the secret key, so this is an understandable design choice.</p>

    <form class="mb-3">
      <div class="form-row">
        <label for="message" class="col-md-3 col-lg-2 col-form-label">Message <code>M</code></label>
        <div class="col-md-9 col-lg-10">
          <input id="message" class="form-control" placeholder="Signed message" v-model="message" />
        </div>
      </div>
    </form>

    <data-row name="“Random” scalar" :data="repr(signature.randomScalar())" wrapper='r = Sc(Hash(nonce ‖ M)) = Sc("$")'>
      Like in <a href="https://tools.ietf.org/html/rfc6979">RFC 6979</a>, the “random” scalar <code>r</code> is chosen
      based on the secret key and the message <code>M</code>.
    </data-row>
    <data-row name="Signature point" :data="repr(signature.random_point())" wrapper='R = [r]B = Pt("$")'></data-row>
    <data-row name="Hash scalar" :data="repr(signature.hashScalar())" wrapper='h = Sc(Hash(R ‖ A ‖ M)) = Sc("$")'>
      Unlike vanilla Schnorr, we include the public key <code>A</code> to values being hashed.
    </data-row>
    <data-row name="Signature scalar" :data="repr(signature.scalar())" wrapper='s = r + h*a = Sc("$")'></data-row>

    <h3 id="verification" class="mt-4">
      Verification
      <a href="#" role="button" class="badge badge-primary" @click.prevent="copyFromSigning()"
         title="Copy from signing"><i class="far fa-clipboard"></i></a>
    </h3>

    <p>Verification uses the equation following from Schnorr and the modified signing procedure:</p>
    <equation>[s]B == R + [H(R ‖ A ‖ M)]A.</equation>

    <form>
      <div class="form-row mb-2">
        <label for="signed-message" class="col-md-3 col-lg-2 col-form-label">Message <code>M</code></label>
        <div class="col-md-9 col-lg-10">
          <input id="signed-message" class="form-control" autocomplete="off" placeholder="Signed message"
                 v-model="signedMessage">
        </div>
      </div>
      <div class="form-row mb-2">
        <label for="signer" class="col-md-3 col-lg-2 col-form-label">Public key <code>A</code></label>
        <div class="col-md-9 col-lg-10 input-group">
          <input id="signer" class="form-control" autocomplete="off" placeholder="Public key" v-model="signer"
                 :class="{ 'is-invalid': verification.signerParseError || verification.decompressionError }">
          <div class="invalid-feedback" v-if="verification.signerParseError">Error parsing public key.</div>
          <div class="invalid-feedback" v-if="verification.decompressionError">Public key does not correspond
            to a curve point.</div>
        </div>
      </div>
      <div class="form-row mb-3">
        <label for="signature" class="col-md-3 col-lg-2 col-form-label">Signature <code>(R, s)</code></label>
        <div class="col-md-9 col-lg-10 input-group">
          <textarea id="signature" class="form-control" style="resize: none;" placeholder="Signature"
                    :class="{ 'is-invalid': verification.signatureParseError }" v-model="verifySignature"></textarea>
          <div class="invalid-feedback" v-if="verification.signatureParseError">Error parsing signature.
            The signature should be 64 bytes.</div>
        </div>
      </div>
    </form>
    <template v-if="!verification.error">
      <data-row name="Hash scalar" :data="repr(verification.hashScalar)" wrapper='h = Sc(Hash(R ‖ A ‖ M)) = Sc("$")'>
        Hash scalar can be readily recreated from public information.
      </data-row>
      <data-row name="EC point" :data="repr(verification.computedPoint)" wrapper='R′ = [s]B - [h]A = Pt("$")'>
        <status slot="key" :status="verification.success ? 'ok' : 'fail'" />
        To verify whether signature is valid, it’s enough to compare <code>R′</code>
        to first 32 bytes of the signature (i.e., <code>R</code>).
      </data-row>
    </template>
  </div>
</template>

<script>
  import DataRow from '../components/DataRow.vue';
  import Equation from '../components/Equation.vue';
  import Seed from '../components/Seed.vue';
  import Status from '../components/Status.vue';
  import withEncoding from '../mixins/withEncoding';

  export default {
    mixins: [ withEncoding ],
    components: { Equation, DataRow, Seed, Status },

    data() {
      const keypair = new this.$crypto.Keypair();
      const message = 'Hello, world!';
      const signature = keypair.sign(this.$Buffer.from(message)).bytes();

      return {
        keypair,
        message,
        signedMessage: message,
        signer: this.$Buffer.from(keypair.publicKey().bytes()).toString(this.encoding),
        verifySignature: this.$Buffer.from(signature).toString(this.encoding),
      }
    },

    computed: {
      signature() {
        const binaryMessage = this.$Buffer.from(this.message, 'utf8');
        return this.keypair.sign(binaryMessage);
      },

      verification() {
        const binaryMessage = this.$Buffer.from(this.signedMessage, 'utf8');
        let publicKey, signature, verification;
        let signerParseError = false;
        let signatureParseError = false;

        try {
          const buffer = this.$Buffer.from(this.signer, this.encoding);
          publicKey = this.$crypto.PublicKey.parse(buffer);
        } catch (e) {
          signerParseError = true;
        }

        try {
          signature = this.$Buffer.from(this.verifySignature, this.encoding);
          if (!signerParseError) {
            // An error might occur here if the scalar has set upper bits.
            verification = publicKey.verification(binaryMessage, signature);
          }
        } catch (e) {
          signatureParseError = true;
        }

        if (signerParseError || signatureParseError) {
          return {
            error: true,
            signerParseError,
            signatureParseError,
          };
        }

        return {
          error: verification.decompressionError(),
          decompressionError: verification.decompressionError(),
          hashScalar: verification.hashScalar(),
          computedPoint: verification.computedPoint(),
          success: verification.success(),
        };
      }
    },

    methods: {
      copyFromSigning() {
        this.signedMessage = this.message;
        this.signer = this.repr(this.keypair.publicKey().bytes());
        this.verifySignature = this.repr(this.signature.bytes());
      }
    }
  };
</script>
