import './common';

function reportError(error) {
  document.querySelector('.loading-progress').classList.add('border-danger');
  const cardTitle = document.querySelector('.loading-progress .card-title');
  cardTitle.classList.add('text-danger');
  cardTitle.innerText = 'Loading failed';

  const cardText = document.querySelector('.loading-progress .card-text');
  cardText.innerText = error;
}

function getHtmlFragments(rootId) {
  const slots = {};
  const slotElements = document.querySelectorAll(`${rootId} [slot]`);
  slotElements.forEach((slotElement) => {
    const slotName = slotElement.attributes.slot.value;
    slots[slotName] = slotElement.innerHTML;
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

  const encodingRadios = document.querySelectorAll('input[name=encoding]');
  encodingRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      mountedApp.encoding = radio.value;
    });
  });
}
