<template>
  <div>
    <p class="lead">One of the counter-intuitive feats of Ed25519 is that there are signatures matching any
      given message (or at least, a non-trivial fraction of messages, say, 1/8).</p>

    <p>This result doesn’t break Ed25519: the signatures are valid under a specifically generated public key,
      which cannot be obtained with valid key generation. Still, it looks <em>fascinating</em>.</p>
    <p>To obtain “wildcard” signatures, let’s first take the identity point as the public key: <code>A = O</code>.
      The verification equation</p>
    <equation>[s]B = R + [H(R || A || M)]A</equation>
    <p>loses the second term on the right-hand side; no matter the value of the hash scalar <code>H(R || A || M)</code>,
      when multiplied by the identity, it yields <code>O</code>. The equation transforms into <code>[s]B = R</code>;
      thus, signature <code>([s]B, s)</code> for any possible scalar <code>s</code> is a valid signature for <em>any</em>
      message under public key <code>O</code>.</p>
    <p>The identity point has conspicuous serialization <code>0x0100…00</code>. Not to fear; there are other public keys
      that lead to almost the same result. These 8 points form the <em>torsion subgroup</em> <code>G<sub>tors</sub></code> on the Ed25519 elliptic curve;
      for any such point <code>E</code>, <code>[8]E = O</code>. The torsion group is isomorphic to integers modulo 8,
      i.e., we can select a group generator <code>E<sub>1</sub></code>, such that the group is</p>
    <equation>G<sub>tors</sub> = { O, E<sub>1</sub>, E<sub>2</sub> ≡ [2]E<sub>1</sub>, …, E<sub>7</sub> ≡ [7]E<sub>1</sub> }.</equation>
    <p>For any public key <code>A</code> in <code>G<sub>tors</sub></code>, with probability at least 1/8 over message space,
      the hash scalar <code>H([s]B || A || M)</code> is divisible by the point order (1, 2, 4 or 8). In this case,
      signature <code>([s]B, s)</code> will still be valid.</p>

    <form>
      <div class="form-group form-row">
        <label class="col-md-3 col-lg-2 col-form-label pt-0">Torsion point</label>
        <div class="col-md-9 col-lg-10">
          <div v-for="i in [0, 1, 2, 3, 4, 5, 6, 7]" class="custom-control custom-radio custom-control-inline">
            <input type="radio" :id="'torsion-index-' + i" name="torsion-index" class="custom-control-input" :value="i" v-model="torsionIndex">
            <label class="custom-control-label" :for="'torsion-index-' + i"><code v-if="i === 0">O</code><code v-else>E<sub>{{ i }}</sub></code></label>
          </div>
        </div>
        <label class="col-md-3 col-lg-2 col-form-label" for="user-message">
          Feeling lucky?
          <status :status="publicKey.verify($Buffer.from(message, 'utf8'), signature.bytes()) ? 'ok' : 'fail'"></status>
        </label>
        <div class="col-md-9 col-lg-10">
          <input id="user-message" type="text" class="form-control" v-model="message" />
          <small class="form-text text-muted">A message you enter will be correctly signed with the signature below with probability {{ probability }}.</small>
        </div>
      </div>
    </form>

    <data-row name="Public key" :data="repr(publicKey.bytes())" wrapper='A = Pt("$")'></data-row>
    <data-row name="Signature" :data="repr(signature.bytes())">
      <a slot="key" href="#" role="button" title="Generate a new signature" @click.prevent="updateSignature()"><i class="fas fa-dice"></i></a>
    </data-row>
    <data-row v-for="(message, index) in messages" :key="message" :name="messageName(index)" :data="message" wrapper="$"></data-row>
    <div class="row my-2 justify-content-center">
      <button type="button" class="btn btn-primary btn-sm" @click="moreMessages()">Some more messages</button>
    </div>
  </div>
</template>
<script>
  import DataRow from '../components/DataRow.vue';
  import Equation from '../components/Equation.vue';
  import Status from '../components/Status.vue';
  import withEncoding from '../mixins/withEncoding';

  export default {
    components: { DataRow, Equation, Status },
    mixins: [ withEncoding ],

    data() {
      const torsionIndex = 1;
      const signature = this.$crypto.Signature.fromRandomScalar();
      const publicKey = this.$crypto.SMALL_SUBGROUP[torsionIndex];

      return {
        torsionIndex,
        signature,
        message: 'Hello, world!',
        messages: signature.generateValidMessages(publicKey, 3)
      }
    },

    computed: {
      publicKey() {
        return this.$crypto.SMALL_SUBGROUP[this.torsionIndex];
      },

      probability() {
        switch (this.torsionIndex) {
          case 0: return '1';
          case 1:
          case 3:
          case 5:
          case 7: return '1/8';
          case 2:
          case 6: return '1/4';
          case 4: return '1/2';
        }
      }
    },

    watch: {
      torsionIndex() {
        this.messages = this.signature.generateValidMessages(this.publicKey, 3);
      }
    },

    methods: {
      messageName(index) {
        switch (index) {
          case 0: return 'Signed message';
          case 1: return '…Or this one?';
          case 2: return '…Or maybe this?';
          case 3: return '…Or this?';
          case 4: return 'Another message';
          case 5: return 'One more';
          case 42: return 'Meaning of life';
          case 666: return 'Message approved by Mr. Satan';
          default: return `Message #${index}`;
        }
      },

      updateSignature() {
        this.signature = this.$crypto.Signature.fromRandomScalar();
        this.messages = this.signature.generateValidMessages(this.publicKey, 3);
      },

      moreMessages() {
        const messages = this.signature.generateValidMessages(this.publicKey, 3);
        for (let message of messages) {
          this.messages.push(message);
        }
      }
    }
  }
</script>
