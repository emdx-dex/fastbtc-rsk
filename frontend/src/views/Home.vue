<template>
  <page>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field
        :rules="rbtcAddressRule"
        label="RBTC address"
        required
        v-model="rbtcAddress"
      ></v-text-field>
      <v-text-field
        :rules="valueRule"
        label="Value"
        required
        single-line
        type="number"
        v-model="value"
      ></v-text-field>
      <v-btn
        :disabled="!valid"
        @click="submit"
        class="home__form__submit mr-4"
        color="success"
      >
        submit
      </v-btn>
    </v-form>
    <div class="home__ordersummary">
      <order
        :btcDepositAddress="btcDepositAddress"
        :rbtcTransferAddress="rbtcTransferAddress"
        :show="show"
        :status="status"
        :value="transferValue"
      ></order>
    </div>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import _ from 'lodash';
import { get as getCookie, NAMES } from '@/utils/cookies';
import STATUS from '@/utils/status';

export default {
  name: 'Home',
  data: () => ({
    btcDepositAddress: '',
    error: '',
    interval: null,
    rbtcAddress: '',
    rbtcAddressRule: [(v) => v !== '' || 'Address is required.'],
    rbtcTransferAddress: '',
    show: false,
    status: '',
    transferValue: '',
    valid: false,
    value: '',
    valueRule: [
      (v) => v !== '' || 'Value is required.',
      (v) => v > 0 || 'Value should be greater than 0.',
    ],
  }),
  methods: {
    async submit() {
      const { rbtcAddress, value } = this;
      const valid = this.$refs.form.validate();

      if (valid) {
        this.valid = false;
        this.$store.dispatch('order/create', { rbtcAddress, value });
      }
    },
  },
  mounted: async function () {
    const order = getCookie(NAMES.ORDER);

    if (!_.isEmpty(order)) {
      this.$store.dispatch('order/get', { id: order });
    }
  },
  watch: {
    '$store.state.order.error': function (error) {
      this.error = error;
    },
    '$store.state.order.loading': function (loading) {
      this.loading = loading;
    },
    '$store.state.order.order': function (order) {
      if (!_.isEmpty(order)) {
        const { btcDepositAddress, id, rbtcTransferAddress, status, value } = order;

        this.btcDepositAddress = btcDepositAddress;
        this.rbtcTransferAddress = rbtcTransferAddress;
        this.show = true;
        this.status = status;
        this.transferValue = value;

        if (
          (status === STATUS.OPEN || status === STATUS.PENDING) &&
          _.isNull(this.interval)
        ) {
          this.interval = setInterval(() => {
            this.$store.dispatch('order/get', { id });
          }, 10000);
        } else if (status === STATUS.CONFIRMED || status === STATUS.FAILED) {
          clearInterval(this.interval);
        }
      }
    },
  },
};
</script>
