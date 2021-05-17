<template>
  <div>
    <form @submit.prevent="">
      <div class="form-group row mb-2">
        <label class="col-md-3 col-lg-2 col-form-label pt-0">Torsion point</label>
        <div class="col-md-9 col-lg-10">
          <div
            v-for="i in [0, 1, 2, 3, 4, 5, 6, 7]"
            :key="i"
            class="form-check form-check-inline"
          >
            <input
              :id="'torsion-index-' + i"
              v-model="torsionIndex"
              type="radio"
              name="torsion-index"
              class="form-check-input"
              :value="i"
            >
            <label class="form-check-label" :for="'torsion-index-' + i">
              <code v-if="i === 0">O</code><code v-else>E<sub>{{ i }}</sub></code>
            </label>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label class="col-md-3 col-lg-2 col-form-label" for="user-message">
          Feeling lucky?
          <Status :status="publicKey.verify($Buffer.from(message, 'utf8'), signature.bytes()) ? 'ok' : 'fail'" />
        </label>
        <div class="col-md-9 col-lg-10">
          <input
            id="user-message"
            v-model="message"
            type="text"
            class="form-control"
          >
          <small class="form-text text-muted">
            A message you enter will be correctly signed with the signature below
            with probability {{ probability }}.
          </small>
        </div>
      </div>
    </form>

    <DataRow
      name="Public key"
      :data="repr(publicKey.bytes())"
      wrapper="A = Pt(&quot;$&quot;)"
    />
    <DataRow name="Signature" :data="repr(signature.bytes())">
      <template #key>
        <a
          href="#"
          role="button"
          title="Generate a new signature"
          @click.prevent="updateSignature()"
        ><i class="fas fa-dice"></i></a>
      </template>
    </DataRow>
    <DataRow
      v-for="(sampleMessage, index) in messages"
      :key="sampleMessage"
      :name="messageName(index)"
      :data="sampleMessage"
      wrapper="$"
    />
    <div class="row mt-3 justify-content-center">
      <div class="col-auto">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="moreMessages()"
        >Some more messages</button>
      </div>
    </div>
  </div>
</template>
<script>
import DataRow from '../components/DataRow.vue';
import Status from '../components/Status.vue';
import withEncoding from '../mixins/withEncoding';

export default {
  components: { DataRow, Status },
  mixins: [withEncoding],

  data() {
    const torsionIndex = 1;
    const signature = this.$crypto.Signature.fromRandomScalar();
    const publicKey = this.$crypto.SMALL_SUBGROUP[torsionIndex];

    return {
      torsionIndex,
      signature,
      message: 'Hello, world!',
      messages: signature.generateValidMessages(publicKey, 3),
    };
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
        default: return ''; // unreachable
      }
    },
  },

  watch: {
    torsionIndex() {
      this.messages = this.signature.generateValidMessages(this.publicKey, 3);
    },
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
      messages.forEach((message) => this.messages.push(message));
    },
  },
};
</script>
