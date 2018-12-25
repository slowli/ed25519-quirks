/* eslint-env jquery */

function reportError(error) {
  $('.loading-progress').addClass('border-danger');
  $('.loading-progress .card-title').addClass('text-danger').text('Loading failed');
  $('.loading-progress .card-text').text(`${error}`);
}

function getHtmlFragments(selector) {
  const slots = {};
  $(selector).children('[slot]').each(function each() {
    const slotName = $(this).attr('slot');
    slots[slotName] = $(this)[0].innerHTML;
  });
  return slots;
}

export default async function mount(component) {
  // Needed to patch `TextEncoder` / `TextDecoder`.
  await import(/* webpackChunkName: "bundle" */ './encoding');

  const { default: Vue } = await import(/* webpackChunkName: "bundle" */ 'vue');

  try {
    const { default: crypto } = await import(/* webpackChunkName: "bundle" */ './crypto');
    Vue.use(crypto);
  } catch (error) {
    reportError(error);
  }

  const { default: copy } = await import(/* webpackChunkName: "bundle" */ 'copy-text-to-clipboard');
  const { Buffer } = await import(/* webpackChunkName: "bundle" */ 'buffer');
  Vue.use((vue) => {
    // eslint-disable-next-line no-param-reassign
    vue.prototype.$Buffer = Buffer;
    // eslint-disable-next-line no-param-reassign
    vue.prototype.$copy = copy;
  });

  const app = new Vue({
    el: '#app',
    data: {
      encoding: $('input[name=encoding]:checked').val(),
      htmlFragments: getHtmlFragments('#app'),
    },

    render(createElement) {
      return createElement(component, {
        props: {
          encoding: this.encoding,
          htmlFragments: this.htmlFragments,
        },
      });
    },
  });

  $('input[name=encoding]').change(() => {
    app.encoding = $('input[name=encoding]:checked').val();
  });
}
