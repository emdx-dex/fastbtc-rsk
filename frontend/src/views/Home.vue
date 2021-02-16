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
        <v-col cols="12" md="12" v-if="isRbtcToBtc">
          <v-text-field
            :required="isRbtcToBtc"
            :rules="senderAddressRule"
            :label="fromCoin + ' Sender address (Source funds)'"
            v-model="senderAddress"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="12">
          <v-text-field
            :rules="addressRule"
            :label="toCoin + ' Recipient address '  + (toCoin === 'RBTC' ? '(To deposit)' : '')"
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
    <div class="home__ordersummary" v-if="showOrderSummary">
      <v-card elevation="2">
        <v-card-title class="title text--primary">
          Order details
        </v-card-title>
        <order :order="order"></order>
      </v-card>
    </div>
    <v-alert
      border="left"
      colored-border
      type="warning"
      elevation="2"
      class="mt-8"
    >
      Por dudas, consultas o problemas tecnicos comunicarse a <a :href="'mailto:'+supportEmail">{{ supportEmail }}</a>
    </v-alert>
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
import {
  CONFIRMED,
  FAILED,
  PENDING,
  UNCONFIRMED,
} from '../../../shared/status';
import SYMBOLS from '../../../shared/symbols';

const TRANSFER_MAX = process.env.VUE_APP_TRANSFER_MAX;
const TRANSFER_MIN = process.env.VUE_APP_TRANSFER_MIN;

export default {
  name: 'Home',
  data: () => ({
    address: '',
    addressRule: [(v) => !_.isEmpty(v) || 'Address is required.'],
    error: '',
    flow: BTC_TO_RBTC,
    fromCoin: '',
    interval: null,
    isRbtcToBtc: false,
    order: {},
    senderAddress: '',
    senderAddressRule: [(v) => !_.isEmpty(v) || 'Sender address is required.'],
    showConfirmationDialog: false,
    showOrderSummary: false,
    toCoin: '',
    valid: false,
    value: '',
    valueRule: [
      (v) => !_.isEmpty(v) || 'Value is required.',
      (v) => v > 0 || 'Value should be greater than 0.',
      (v) => v <= TRANSFER_MAX || `Value should be lower than ${TRANSFER_MAX}.`,
      (v) => v >= TRANSFER_MIN || `Value should be greater than ${TRANSFER_MIN}.`,
    ],
    supportEmail: "soporte@dominio.com"
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
      this.showOrderSummary = false;
      this.valid = true;

      this.removePooling();
    },
    removePooling() {
      clearInterval(this.interval);

      this.interval = null;
    },
    async submit() {
      const { address, senderAddress, value } = this;
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
          request.rsk = {
            senderAddress,
          };
        }

        this.$store.dispatch('order/create', request);
      }
    },
    setLabels() {
      this.fromCoin = this.flow === BTC_TO_RBTC ? SYMBOLS.BTC : SYMBOLS.RBTC;
      this.toCoin = this.flow === BTC_TO_RBTC ? SYMBOLS.RBTC : SYMBOLS.BTC;
    },
    swapFlow() {
      this.flow = this.flow === BTC_TO_RBTC ? RBTC_TO_BTC : BTC_TO_RBTC;
      this.isRbtcToBtc = this.flow === RBTC_TO_BTC;

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
      this.error = error;
    },
    '$store.state.order.loading': function (loading) {
      this.loading = loading;
    },
    '$store.state.order.order': function (order) {
      this.order = order;

      if (!_.isEmpty(order)) {
        const { id } = order;
        const status = [order.btc.status, order.rsk.status];

        this.showOrderSummary = true;
        this.valid = false;

        if (
          (status.includes(PENDING) || status.includes(UNCONFIRMED)) &&
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
