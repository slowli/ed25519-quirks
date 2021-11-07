<template>
  <div class="row mb-2">
    <label class="col-md-3 col-lg-2 col-form-label" for="seed">Seed
      <a
        href="#"
        role="button"
        title="Generate a new random seed"
        class="text-decoration-none"
        @click.prevent="generateKeypair()"
      ><i class="bi bi-arrow-clockwise"></i></a>
    </label>

    <div class="col-md-9 col-lg-10">
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
  name: 'SeedRow',
  props: {
    encoding: { type: String, required: true },
  },

  data() {
    const keypair = new this.$crypto.Keypair();
    return {
      modelValue: keypair,
      seed: this.$Buffer.from(keypair.seed()).toString(this.encoding),
      seedError: false,
    };
  },

  computed: {
    repr() {
      return (buffer, encoding) => this.$Buffer.from(buffer, encoding).toString(this.encoding);
    },
  },

  watch: {
    encoding() {
      if (!this.seedError) {
        this.seed = this.$Buffer.from(this.modelValue.seed()).toString(this.encoding);
      }
    },
  },

  methods: {
    generateKeypair() {
      this.modelValue = new this.$crypto.Keypair();
      this.seed = this.repr(this.modelValue.seed());
      this.$emit('update:modelValue', this.modelValue);
    },

    updateSeed(input) {
      this.seed = input;
      this.seedError = false;

      try {
        const buffer = this.$Buffer.from(input, this.encoding);
        this.modelValue = this.$crypto.Keypair.fromSeed(buffer);
        this.$emit('update:modelValue', this.modelValue);
      } catch (e) {
        this.seedError = true;
      }
    },
  },
};
</script>
