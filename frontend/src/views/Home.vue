<template>
  <page>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-row>
        <v-col cols="12" md="5">
          <v-text-field
            :rules="valueRule"
            label="Value"
            required
            single-line
            type="number"
            v-model="value"
          >
            <div slot="append">{{ fromCoin }}</div>
          </v-text-field>
        </v-col>
        <v-col class="d-flex justify-center" cols="12" md="2">
          <v-btn @click="swapFlow" icon>
            <v-icon color="darken-2" large> mdi-cached </v-icon>
          </v-btn>
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            label="Value"
            readonly
            single-line
            tabindex="-1"
            type="number"
            v-model="value"
          >
            <div slot="append">{{ toCoin }}</div>
          </v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="12">
          <v-text-field
            :rules="addressRule"
            label="Transfer address"
            required
            v-model="address"
          ></v-text-field>
        </v-col>
      </v-row>
      <div class="home__form__footer">
        <v-btn :disabled="!valid" @click="submit" class="mr-4" color="success">
          submit
        </v-btn>
        <v-btn @click="clear" class="mr-4"> clear order </v-btn>
      </div>
    </v-form>
    <div class="home__ordersummary">
      <v-card elevation="2">
        <order :order="order"></order>
      </v-card>
    </div>
    <confirmation-dialog
      :onCancel="handleCancel"
      :onConfirm="handleConfirm"
      :show="showConfirmationDialog"
    ></confirmation-dialog>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import _ from 'lodash';
import {
  get as getCookie,
  NAMES,
  remove as removeCookie,
} from '@/utils/cookies';
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../shared/flows';
import { CONFIRMED, FAILED, OPEN, PENDING } from '../../../shared/status';
import SYMBOLS from '../../../shared/symbols';

export default {
  name: 'Home',
  data: () => ({
    address: '',
    addressRule: [(v) => !_.isEmpty(v) || 'Address is required.'],
    error: '',
    flow: BTC_TO_RBTC,
    fromCoin: '',
    interval: null,
    order: {},
    showConfirmationDialog: false,
    toCoin: '',
    valid: false,
    value: '',
    valueRule: [
      (v) => !_.isEmpty(v) || 'Value is required.',
      (v) => v > 0 || 'Value should be greater than 0.',
    ],
  }),
  methods: {
    async clear() {
      this.showConfirmationDialog = true;
    },
    handleCancel() {
      this.showConfirmationDialog = false;
    },
    handleConfirm() {
      removeCookie(NAMES.ORDER);

      this.$refs.form.reset();
      this.$refs.form.resetValidation();
      this.$store.dispatch('order/clean');
      this.showConfirmationDialog = false;
      this.valid = true;

      this.removePooling();
    },
    removePooling() {
      clearInterval(this.interval);

      this.interval = null;
    },
    async submit() {
      const { address, value } = this;
      const valid = this.$refs.form.validate();

      if (valid) {
        this.valid = false;

        const request = { flow: this.flow, value };

        if (this.flow === BTC_TO_RBTC) {
          request.rsk = {
            address,
          };
        } else {
          request.btc = {
            address,
          };
        }

        this.$store.dispatch('order/create', request);
      }
    },
    setLabels() {
      this.fromCoin = (this.flow === BTC_TO_RBTC) ? SYMBOLS.BTC : SYMBOLS.RBTC;
      this.toCoin = (this.flow === BTC_TO_RBTC) ? SYMBOLS.RBTC : SYMBOLS.BTC;
    },
    swapFlow() {
      this.flow = (this.flow === BTC_TO_RBTC) ? RBTC_TO_BTC : BTC_TO_RBTC;

      this.setLabels();
    },
  },
  mounted: async function () {
    const order = getCookie(NAMES.ORDER);

    this.setLabels();

    if (!_.isEmpty(order)) {
      this.$store.dispatch('order/get', { id: order });
    }
  },
  watch: {
    '$store.state.order.error': function (error) {
      removeCookie(NAMES.ORDER);

      this.error = error;
    },
    '$store.state.order.loading': function (loading) {
      this.loading = loading;
    },
    '$store.state.order.order': function (order) {
      if (!_.isEmpty(order)) {
        const { id, status } = order;

        this.order = order;
        this.valid = false;

        if (
          (status === OPEN || status === PENDING) &&
          _.isNull(this.interval)
        ) {
          this.interval = setInterval(() => {
            this.$store.dispatch('order/get', { id });
          }, 10000);
        } else if (status === CONFIRMED || status === FAILED) {
          this.removePooling();
        }
      } else {
        if (this.interval) {
          this.removePooling();
        }
      }
    },
  },
};
</script>
