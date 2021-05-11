/* eslint-env mocha */

import { Buffer } from 'buffer';
import chai from 'chai';
import chaiBytes from 'chai-bytes';
import dirtyChai from 'dirty-chai';

const { expect } = chai.use(chaiBytes).use(dirtyChai);
let Keypair;
let PublicKey;
let Signature;
const SMALL_SUBGROUP = [];

describe('crypto', () => {
  before(async () => {
    let group;
    ({
      Keypair, PublicKey, Signature, SMALL_SUBGROUP: group,
    } = await import(/* webpackPrefetch: true */ '../src/crypto'));
    SMALL_SUBGROUP.push(...group);
  });

  describe('SMALL_SUBGROUP', () => {
    it('should have length 8', () => {
      expect(SMALL_SUBGROUP).to.have.lengthOf(8);
    });

    it('should contain public keys', () => {
      SMALL_SUBGROUP.forEach((key) => {
        expect(key).to.be.instanceof(PublicKey);
      });
    });

    it('should contain different elements', () => {
      const uniqueKeys = new Set(SMALL_SUBGROUP.map(
        (key) => Buffer.from(key.bytes()).toString('base64'),
      ));
      expect(uniqueKeys).to.have.lengthOf(8);
    });
  });

  for (let keyIndex = 0; keyIndex < 8; keyIndex += 1) {
    // eslint-disable-next-line no-loop-func
    describe(`SMALL_SUBGROUP[${keyIndex}]`, () => {
      let key = null;
      before(async () => {
        // Block the test until the keys have been loaded.
        key = await new Promise((resolve) => {
          function handler() {
            if (SMALL_SUBGROUP) {
              resolve(SMALL_SUBGROUP[keyIndex]);
            } else {
              setTimeout(handler, 10);
            }
          }

          handler();
        });
      });

      it('should allow to easily create valid signatures for fixed message', () => {
        const message = Buffer.from('Hello, world!', 'utf8');

        let counter = 0;
        for (
          let s = Signature.fromRandomScalar();
          !key.verify(message, s.bytes());
          s = Signature.fromRandomScalar(), counter += 1
        ) {
          // Intentionally empty
        }

        expect(counter).to.be.lessThan(1000);
      });

      it('should allow to find signed message for fixed signature', () => {
        const signature = Signature.fromRandomScalar();
        const messages = signature.generateValidMessages(key, 5);
        expect(messages).to.have.lengthOf(5);

        messages.forEach((message) => {
          const bytes = Buffer.from(message, 'utf8');
          expect(key.verify(bytes, signature.bytes())).to.be.true();
        });
      });
    });
  }

  describe('Keypair', () => {
    it('should yield expected lengths of fields', () => {
      const keypair = new Keypair();
      expect(keypair.seed()).to.have.lengthOf(32);
      expect(keypair.expandedSeed()).to.have.lengthOf(64);
      expect(keypair.scalar()).to.have.lengthOf(32);
      expect(keypair.nonce()).to.have.lengthOf(32);
      expect(keypair.publicKey().bytes()).to.have.lengthOf(32);
    });

    it('should verify signed messages', () => {
      const keypair = new Keypair();
      const message = Uint8Array.from([1, 2, 3]);
      const signature = keypair.sign(message);
      expect(signature.bytes()).to.have.lengthOf(64);
      expect(keypair.publicKey().verify(message, signature.bytes())).to.be.true();
      message[1] = 1;
      expect(keypair.publicKey().verify(message, signature.bytes())).to.be.false();
    });

    it('should create a new keypair each time', () => {
      const keypair = new Keypair();
      for (let i = 0; i < 10; i += 1) {
        const otherKeypair = new Keypair();
        expect(keypair.seed()).to.not.equalBytes(otherKeypair.seed());
      }
    });

    it('should allow to recreate a keypair from a seed', () => {
      const keypair = new Keypair();
      const keypairCopy = Keypair.fromSeed(keypair.seed());
      expect(keypairCopy.publicKey().bytes()).to.equalBytes(keypair.publicKey().bytes());
    });
  });
});
