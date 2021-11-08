export default {
  props: {
    htmlFragments: { type: Object, default: {} },
  },
  data() {
    return {
      encoding: document.querySelector('input[name=encoding]:checked').value,
    };
  },
  methods: {
    repr(buffer, encoding) {
      const outputEncoding = this.encoding
        ?? document.querySelector('input[name=encoding]:checked').value;
      return this.$Buffer.from(buffer, encoding).toString(outputEncoding);
    },
  },
};
