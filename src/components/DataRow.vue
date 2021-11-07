<template>
  <div class="row mb-2">
    <div class="col-md-3 col-lg-2 mb-1 mb-md-0 pe-md-2">
      <a
        href="#"
        role="button"
        class="clipboard float-end text-muted small my-1 ms-1 text-decoration-none"
        title="Copy to clipboard"
        @click.prevent="$copy(data)"
      ><i class="bi bi-clipboard"></i></a>
      {{ name }} <slot name="key"></slot>
    </div>
    <div class="col-md-9 col-lg-10">
      <div class="bg-light code-container">
        <code
          class="text-dark d-inline-block"
          :class="{ wrapped: data.indexOf(' ') < 0 }"
        >{{ wrapper.replace('$', data) }}</code>
        <p v-if="$slots.default" class="small text-muted mb-1">
          <slot></slot>
        </p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DataRow',
  props: {
    name: { type: String, required: true },
    wrapper: { type: String, default: '"$"' },
    data: { type: String, default: '' },
  },
};
</script>
<style>
  .wrapped {
    word-break: break-all;
  }

  a.clipboard:hover {
    color: #545b62;
  }
</style>
