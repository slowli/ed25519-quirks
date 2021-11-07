<template>
  <!-- eslint-disable vue/no-v-html -->
  <div>
    <form @submit.prevent="">
      <Seed v-model="keypair" :encoding="encoding" />
      <div class="row mb-3">
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
      name="Public key"
      :data="repr(keypair.publicKey().bytes())"
      wrapper="A = Pt(&quot;$&quot;)"
    />
    <DataRow
      name="Signature"
      :data="repr(signature.bytes())"
      wrapper="(R, s) = &quot;$&quot;"
    />
    <DataRow
      name="Signature scalar"
      :data="repr(signature.scalar())"
      wrapper="s = Sc(&quot;$&quot;)"
    />
    <DataRow
      name="Modified scalar"
      :data="repr(modifiedScalar.bytes())"
      wrapper="s′ = s + ℓ = Sc(&quot;$&quot;)"
    />
    <DataRow name="New signature" :data="repr(modifiedScalar.signature())">
      <template #key>
        <Status :status="modifiedScalar.valid() ? 'ok' : 'fail'" />
      </template>
    </DataRow>

    <div v-html="htmlFragments.randomness"></div>

    <DataRow
      name="Message"
      :data="message"
      wrapper="$"
    >
      Copied from the previous example together
      with the keypair.
    </DataRow>
    <DataRow
      name="Public key"
      :data="repr(keypair.publicKey().bytes())"
      wrapper="A = Pt(&quot;$&quot;)"
    />
    <DataRow
      name="Random scalar"
      :data="repr(randomizedSignature.randomScalar())"
      wrapper="r = Sc(&quot;$&quot;)"
    >
      <template #key>
        <a
          href="#"
          role="button"
          class="text-decoration-none"
          @click.prevent="generateScalar()"
        ><i class="bi bi-arrow-clockwise"></i></a>
      </template>
    </DataRow>
    <DataRow name="New signature" :data="repr(randomizedSignature.bytes())" />

    <div v-html="htmlFragments.afterRandomness"></div>
  </div>
</template>
<script>
import DataRow from '../components/DataRow.vue';
import Seed from '../components/Seed.vue';
import Status from '../components/Status.vue';
import withEncoding from '../mixins/withEncoding';

export default {
  components: { DataRow, Seed, Status },
  mixins: [withEncoding],

  data() {
    const keypair = new this.$crypto.Keypair();
    const message = 'Hello, world!';

    return {
      keypair,
      message,
      randomScalar: new this.$crypto.RandomScalar(),
    };
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
    },
  },

  methods: {
    generateScalar() {
      this.randomScalar = new this.$crypto.RandomScalar();
    },
  },
};
</script>
