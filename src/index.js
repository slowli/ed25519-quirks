import { Buffer } from 'buffer';
import Vue from 'vue';
import copy from 'copy-text-to-clipboard';

import router from './router';
import App from './App.vue';
import './encoding';

import('./crypto').then(({ default: crypto }) => {
  Vue.use(crypto);
  Vue.use((vue) => {
    // eslint-disable-next-line no-param-reassign
    vue.prototype.$Buffer = Buffer;
    // eslint-disable-next-line no-param-reassign
    vue.prototype.$copy = copy;
  });

  // eslint-disable-next-line no-new
  new Vue({
    el: '#app',
    router,
    render: createElement => createElement(App),
  });
}).catch((err) => {
  document.getElementById('loading-message').innerText = `Loading failed: ${err}`;
});
