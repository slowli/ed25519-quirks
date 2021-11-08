<template>
  <!-- eslint-disable vue/no-v-html -->
  <div>
    <div v-html="htmlFragments.generation"></div>

    <form class="mb-3" @submit.prevent="">
      <SeedRow v-model="keypair" :encoding="encoding" />
    </form>

    <DataRow
      name="Expanded seed"
      :data="repr(keypair.expandedSeed())"
      wrapper="xseed = Hash(seed) = &quot;$&quot;"
    >
      The seed is expanded to 64 bytes with the help of a hash function.
      Most Ed25519 implementations use SHA-512, but any cryptographic hash function with 64-byte output can suffice.
    </DataRow>
    <DataRow
      name="Secret scalar"
      :data="repr(keypair.scalar())"
      wrapper="a = Sc(clamp(xseed[..32])) = Sc(&quot;$&quot;)"
    >
      The first 32 bytes are “clamped” by setting
      the lower 3 bits and the highest bit (in the LSB interpretation) to 0, and the second-highest bit to 1.
      The resulting byte sequence is interpreted as a scalar <code>a</code>.
    </DataRow>
    <DataRow
      name="Nonce"
      :data="repr(keypair.nonce())"
      wrapper="nonce = xseed[32..] = &quot;$&quot;"
    >
      The upper 32 bytes of the expanded seed are used as a <em>nonce</em> during signing.
    </DataRow>
    <DataRow
      name="Public key"
      :data="repr(keypair.publicKey().bytes())"
      wrapper="A = [a]B = Pt(&quot;$&quot;)"
    >
      The public key is still (the encoding of) a point on the elliptic curve, obtained by multiplying
      the basepoint <code>B</code> by the secret scalar.
    </DataRow>

    <p>
      If you want to know why the secret scalar is clamped in this way, refer to
      <a href="../clamping/">this explanation</a>.
    </p>

    <div v-html="htmlFragments.signing"></div>

    <form class="mb-3" @submit.prevent="">
      <div class="row">
        <label for="message" class="col-md-3 col-lg-2 col-form-label">Message <code>M</code></label>
        <div class="col-md-9 col-lg-10">
          <input
            id="message"
            v-model="message"
            class="form-control"
            placeholder="Signed message"
          >
        </div>
      </div>
    </form>

    <DataRow
      name="“Random” scalar"
      :data="repr(signature.randomScalar())"
      wrapper="r = Sc(Hash(nonce ‖ M)) = Sc(&quot;$&quot;)"
    >
      Like in <a href="https://tools.ietf.org/html/rfc6979">RFC 6979</a>, the “random” scalar <code>r</code> is chosen
      based on the secret key and the message <code>M</code>.
    </DataRow>
    <DataRow
      name="Signature point"
      :data="repr(signature.random_point())"
      wrapper="R = [r]B = Pt(&quot;$&quot;)"
    />
    <DataRow
      name="Hash scalar"
      :data="repr(signature.hashScalar())"
      wrapper="h = Sc(Hash(R ‖ A ‖ M)) = Sc(&quot;$&quot;)"
    >
      Unlike vanilla Schnorr, we include the public key <code>A</code> to values being hashed.
    </DataRow>
    <DataRow
      name="Signature scalar"
      :data="repr(signature.scalar())"
      wrapper="s = r + h*a = Sc(&quot;$&quot;)"
    />

    <div v-html="htmlFragments.verification"></div>

    <form @submit.prevent="">
      <div class="row mb-2">
        <label for="signed-message" class="col-md-3 col-lg-2 col-form-label">Message <code>M</code></label>
        <div class="col-md-9 col-lg-10">
          <input
            id="signed-message"
            v-model="signedMessage"
            class="form-control"
            autocomplete="off"
            placeholder="Signed message"
          >
        </div>
      </div>
      <div class="row mb-2">
        <label for="signer" class="col-md-3 col-lg-2 col-form-label">Public key <code>A</code></label>
        <div class="col-md-9 col-lg-10">
          <input
            id="signer"
            v-model="signer"
            class="form-control"
            autocomplete="off"
            placeholder="Public key"
            :class="{ 'is-invalid': verification.signerParseError || verification.decompressionError }"
          >
          <div v-if="verification.signerParseError" class="invalid-feedback">
            Error parsing public key.
          </div>
          <div v-if="verification.decompressionError" class="invalid-feedback">
            Public key does not correspond
            to a curve point.
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label for="signature" class="col-md-3 col-lg-2 col-form-label">Signature <code>(R, s)</code></label>
        <div class="col-md-9 col-lg-10">
          <textarea
            id="signature"
            v-model="verifySignature"
            class="form-control"
            style="resize: none;"
            placeholder="Signature"
            :class="{ 'is-invalid': verification.signatureParseError }"
          ></textarea>
          <div v-if="verification.signatureParseError" class="invalid-feedback">
            Error parsing signature.
            The signature should be 64 bytes.
          </div>
        </div>
      </div>
    </form>
    <template v-if="!verification.error">
      <DataRow
        name="Hash scalar"
        :data="repr(verification.hashScalar)"
        wrapper="h = Sc(Hash(R ‖ A ‖ M)) = Sc(&quot;$&quot;)"
      >
        Hash scalar can be readily recreated from public information.
      </DataRow>
      <DataRow
        name="EC point"
        :data="repr(verification.computedPoint)"
        wrapper="R′ = [s]B - [h]A = Pt(&quot;$&quot;)"
      >
        <template #key>
          <StatusSpan :status="verification.success ? 'ok' : 'fail'" />
        </template>
        To verify whether signature is valid, it’s enough to compare <code>R′</code>
        to first 32 bytes of the signature (i.e., <code>R</code>).
      </DataRow>
    </template>
  </div>
</template>

<script>
/* eslint-env jquery */

import DataRow from '../components/DataRow.vue';
import SeedRow from '../components/SeedRow.vue';
import StatusSpan from '../components/StatusSpan.vue';
import withEncoding from '../mixins/withEncoding';

export default {
  components: {
    DataRow, SeedRow, StatusSpan,
  },
  mixins: [withEncoding],

  data() {
    const keypair = new this.$crypto.Keypair();
    const message = 'Hello, world!';
    const signature = keypair.sign(this.$Buffer.from(message)).bytes();

    return {
      keypair,
      message,
      signedMessage: message,
      signer: this.repr(keypair.publicKey().bytes()),
      verifySignature: this.repr(signature),
    };
  },

  computed: {
    signature() {
      const binaryMessage = this.$Buffer.from(this.message, 'utf8');
      return this.keypair.sign(binaryMessage);
    },

    verification() {
      const binaryMessage = this.$Buffer.from(this.signedMessage, 'utf8');
      let verification;
      let signerParseError = false;
      let signatureParseError = false;
      let signerKey = null;
      let verifySignatureBytes = null;

      try {
        const buffer = this.$Buffer.from(this.signer, this.encoding);
        signerKey = this.$crypto.PublicKey.parse(buffer);
      } catch (e) {
        signerParseError = true;
      }

      try {
        verifySignatureBytes = this.$Buffer.from(this.verifySignature, this.encoding);
        if (signerKey != null) {
          // An error might occur here if the scalar has set upper bits.
          verification = signerKey.verification(binaryMessage, verifySignatureBytes);
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
    },
  },

  watch: {
    encoding(_, oldEncoding) {
      try {
        const parsedSigner = this.$Buffer.from(this.signer, oldEncoding);
        this.signer = this.repr(parsedSigner);
      } catch (e) {
        // Nothing we can do, unfortunately.
      }

      try {
        const parsedSignature = this.$Buffer.from(this.verifySignature, oldEncoding);
        this.verifySignature = this.repr(parsedSignature);
      } catch (e) {
        // Nothing we can do, unfortunately.
      }
    },
  },

  mounted() {
    const verifyButton = document.querySelector('#verification button');
    verifyButton.style.display = 'inline-block';
    verifyButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.copyFromSigning();
    });
  },

  methods: {
    copyFromSigning() {
      this.signedMessage = this.message;
      this.signer = this.repr(this.keypair.publicKey().bytes());
      this.verifySignature = this.repr(this.signature.bytes());
    },
  },
};
</script>
