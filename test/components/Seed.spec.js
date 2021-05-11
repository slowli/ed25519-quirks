/* eslint-env mocha */

import { mount } from '@vue/test-utils';
import { Buffer as $Buffer } from 'buffer';
import chai from 'chai';
import chaiBytes from 'chai-bytes';
import dirtyChai from 'dirty-chai';
import Seed from '../../src/components/Seed.vue';

const { expect } = chai.use(chaiBytes).use(dirtyChai);
// Cryptographic dependency that we need to load asynchronously.
let $crypto = {};

function createSeed({ encoding } = {}) {
  return mount(Seed, {
    props: {
      encoding: encoding || 'base64',
    },
    global: {
      mocks: { $Buffer, $crypto },
    },
  });
}

describe('Seed.vue', () => {
  before(async () => {
    $crypto = await import(/* webpackPrefetch: true */ '../../src/crypto');
  });

  it('should display seed in base64 encoding', () => {
    const seed = createSeed();
    const len = Math.ceil((32 * 8) / 6) + 1;
    expect(seed.find('input[type=text]').element.value).to.have.lengthOf(len);
  });

  it('should display seed in hex encoding', () => {
    const seed = createSeed({ encoding: 'hex' });
    expect(seed.find('input[type=text]').element.value).to.have.lengthOf(32 * 2);
  });

  it('should display error if seed is invalid', async () => {
    const seed = createSeed();
    expect(seed.find('.invalid-feedback').exists()).to.be.false();

    const input = seed.find('input[type=text]');
    input.element.value = 'invalid';
    await input.trigger('input');
    await seed.vm.$nextTick();
    expect(seed.find('.invalid-feedback').exists()).to.be.true();
  });

  it('should update encoding of displayed valid seed', async () => {
    const seed = createSeed();
    const seedValue = $Buffer.from(seed.find('input[type=text]').element.value, 'base64');
    await seed.setProps({ encoding: 'hex' });
    await seed.vm.$nextTick();
    const updatedValue = $Buffer.from(seed.find('input[type=text]').element.value, 'hex');
    expect(updatedValue).to.equalBytes(seedValue);
  });

  it('should not update encoding of displayed invalid seed', async () => {
    const seed = createSeed();
    const input = seed.find('input[type=text]');
    input.element.value = 'invalid';
    await input.trigger('input');
    await seed.setProps({ encoding: 'hex' });
    await seed.vm.$nextTick();
    expect(input.element.value).to.equal('invalid');
  });

  it('should update seed on demand', async () => {
    const seed = createSeed();
    const seeds = new Set();
    for (let i = 0; i < 5; i += 1) {
      seeds.add(seed.find('input[type=text]').element.value);
      await seed.find('a[role=button]').trigger('click');

      // We have a single `seed` component; i.e., loop iterations are not independent.
      // eslint-disable-next-line no-await-in-loop
      await seed.vm.$nextTick();
    }
    expect(seeds).to.have.lengthOf(5);
  });
});
