import { Buffer } from 'buffer';
import Vue from 'vue';
import copy from 'copy-text-to-clipboard';

import router from './router';
import App from './App.vue';
import './encoding';

import('./crypto').then(crypto => {
  Vue.use(crypto.plugin);
  Vue.use(Vue => {
    Vue.prototype.$Buffer = Buffer;
    Vue.prototype.$copy = copy;
  });

  new Vue({
    el: '#app',
    router,
    render: createElement => createElement(App)
  });
}).catch(e => console.error(e));
