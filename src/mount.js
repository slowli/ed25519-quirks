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

export default async function mount(rootComponent) {
  // Needed to patch `TextDecoder`.
  await import(/* webpackChunkName: "bundle" */ './TextDecoder');

  const { createApp } = await import(/* webpackChunkName: "bundle" */ 'vue');
  const app = createApp(rootComponent, {
    htmlFragments: getHtmlFragments('#app'),
  });

  try {
    app.config.globalProperties.$crypto = await import(/* webpackChunkName: "bundle" */ './crypto');
  } catch (error) {
    reportError(error);
  }

  const { default: copy } = await import(/* webpackChunkName: "bundle" */ 'copy-text-to-clipboard');
  const { Buffer } = await import(/* webpackChunkName: "bundle" */ 'buffer');
  app.config.globalProperties.$Buffer = Buffer;
  app.config.globalProperties.$copy = copy;

  const mountedApp = app.mount('#app');

  $('input[name=encoding]').change(() => {
    mountedApp.encoding = $('input[name=encoding]:checked').val();
  });
}
