<template>
  <div class="row mb-1">
    <div class="col-md-3 col-lg-2 mb-1 mb-md-0">
      <a href="#" role="button" class="clipboard float-right text-secondary small my-1 ml-1" title="Copy to clipboard"
         @click.prevent="$copy(data)"><i class="far fa-copy"></i></a>
      {{ name }}<slot name="key"/>
    </div>
    <div class="col-md-9 col-lg-10 bg-light pb-1">
      <code class="text-dark d-inline-block"
            :class="{ wrapped: data.indexOf(' ') < 0 }">{{ wrapper.replace('$', data) }}</code>
      <p class="small text-muted mb-1" v-if="$slots.default">
        <slot/>
      </p>
    </div>
  </div>
</template>
<style>
  .wrapped {
    word-break: break-all;
  }

  a.clipboard:hover {
    color: #545b62;
  }
</style>
<script>
  export default {
    name: "DataRow",
    props: {
      name: { type: String, required: true },
      wrapper: { type: String, default: '"$"' },
      data: { type: String }
    }
  }
</script>
