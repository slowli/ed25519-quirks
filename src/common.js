/**
 * Imports / logic common for all pages (including non-interactive ones).
 */

import './common.scss';
import '../assets/icons/bootstrap-icons.scss';

import 'bootstrap/js/dist/dropdown';

window.addEventListener('DOMContentLoaded', () => {
  let encoding = localStorage.getItem('encoding') || '';
  if (['hex', 'base64'].indexOf(encoding) < 0) {
    encoding = 'base64';
    localStorage.setItem('encoding', encoding);
  }

  const encodingRadios = document.querySelectorAll('input[name=encoding]');
  encodingRadios.forEach((radio) => {
    // eslint-disable-next-line no-param-reassign
    radio.checked = radio.value === encoding;
    radio.addEventListener('change', () => {
      localStorage.setItem('encoding', radio.value);
    });
  });
});
