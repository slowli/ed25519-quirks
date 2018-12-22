<template>
  <div class="form-row mb-2">
    <div class="col-md-3 col-lg-2 col-form-label">
      <label for="seed">Seed</label>
      <a
        href="#"
        role="button"
        title="Generate a new random seed"
        @click.prevent="generateKeypair()"
      ><i class="fas fa-dice"></i></a>
    </div>

    <div class="col-md-9 col-lg-10 input-group">
      <input
        id="seed"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': seedError }"
        :value="seed"
        @input="updateSeed($event.target.value)"
      >
      <div v-if="seedError" class="invalid-feedback">
        Invalid seed format.
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Seed',
  props: {
    encoding: { type: String, required: true },
  },

  data() {
    const keypair = new this.$crypto.Keypair();
    return {
      value: keypair,
      seed: this.$Buffer.from(keypair.seed()).toString(this.encoding),
      seedError: false,
    };
  },

  computed: {
    repr() {
      return (buffer, encoding) => this.$Buffer.from(buffer, encoding).toString(this.encoding);
    },
  },

  methods: {
    generateKeypair() {
      this.value = new this.$crypto.Keypair();
      this.seed = this.repr(this.value.seed());
      this.$emit('input', this.value);
    },

    updateSeed(input) {
      this.seed = input;
      this.seedError = false;

      try {
        const buffer = this.$Buffer.from(input, this.encoding);
        this.value = this.$crypto.Keypair.fromSeed(buffer);
        this.$emit('input', this.value);
      } catch (e) {
        this.seedError = true;
      }
    },
  },
};
</script>
