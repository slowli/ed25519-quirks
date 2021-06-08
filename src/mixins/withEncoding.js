/* eslint-env jquery */
export default {
  props: {
    htmlFragments: { type: Object, default: {} },
  },
  data() {
    return { encoding: $('input[name=encoding]:checked').val() };
  },
  methods: {
    repr(buffer, encoding) {
      const outputEncoding = this.encoding ?? $('input[name=encoding]:checked').val();
      return this.$Buffer.from(buffer, encoding).toString(outputEncoding);
    },
  },
};
