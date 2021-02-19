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
            :rules="[senderAddressRule]"
            :label="fromCoin + ' Sender address (Source funds)'"
            v-model="senderAddress"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="12">
          <v-text-field
            :error-messages="addressErrors"
            :rules="[addressRule]"
            :label="
              toCoin +
              ' Recipient address ' +
              (toCoin === 'RBTC' ? '(To deposit)' : '')
            "
            required
            v-model="address"
          ></v-text-field>
        </v-col>
      </v-row>
      <div class="order-alert">
       <p v-show="timeToApproved">Order completion will take an estimate between {{ timeToApproved }}</p>
      </div>
      <div class="home__form__footer">
        <v-btn :disabled="!valid" @click="submit" class="mr-4" color="success">
          submit
        </v-btn>
        <v-btn @click="clear" class="mr-4"> Delete order </v-btn>
      </div>
    </v-form>
    <div class="home__ordersummary" v-if="showOrderSummary">
      <v-card elevation="2">
        <v-card-title class="title text--primary">
          Order ID: #{{ order._id }}
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
      In case you need assistance or have any questions you can write to us:
      <a :href="'mailto:' + supportEmail">{{ supportEmail }}</a>
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
import { CONFIRMED, PENDING, UNCONFIRMED } from '../../../shared/status';
import SYMBOLS from '../../../shared/symbols';
import ConfirmationModal from '@/components/confirmation-dialog';
import ErrorNotification from '@/components/error-notification';
import Order from '@/components/order';
import Page from '@/components/page';
import Web3 from 'web3';

const TRANSFER_MAX = process.env.VUE_APP_TRANSFER_MAX;
const TRANSFER_MIN = process.env.VUE_APP_TRANSFER_MIN;

export default {
  name: 'Home',
  components: {
    'confirmation-dialog': ConfirmationModal,
    'error-notification': ErrorNotification,
    Order,
    Page,
  },
  data: () => ({
    address: '',
    addressErrors: [],
    error: '',
    flow: BTC_TO_RBTC,
    fromCoin: '',
    interval: null,
    isRbtcToBtc: false,
    order: {},
    senderAddress: '',
    showConfirmationDialog: false,
    showOrderSummary: false,
    toCoin: '',
    valid: false,
    value: '',
    valueRule: [
      (v) => !_.isEmpty(v) || 'Value is required.',
      (v) => v > 0 || 'Value should be greater than 0.',
      (v) => v <= TRANSFER_MAX || `Value should be lower than ${TRANSFER_MAX}.`,
      (v) =>
        v >= TRANSFER_MIN || `Value should be greater than ${TRANSFER_MIN}.`,
    ],
    supportEmail: 'support@rsk.co',
  }),
  methods: {
    addressRule(address) {
      this.addressErrors = [];

      switch (true) {
        case _.isEmpty(address):
          return 'Sender address is required.';

        case this.flow === BTC_TO_RBTC && !Web3.utils.isAddress(address):
          return 'Recipient address must be a valid RSK address.';

        default:
          this.$refs.form.resetValidation();

          return true;
      }
    },
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
    senderAddressRule(senderAddress) {
      switch (true) {
        case _.isEmpty(senderAddress):
          return 'Sender address is required.';

        case !Web3.utils.isAddress(senderAddress):
          return 'Sender address must be a valid RSK address.';

        default:
          return true;
      }
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
      const formErrors = _.get(error, 'form', {});

      this.error = error;
      this.removePooling();

      Object.keys(formErrors).forEach((key) => {
        this[`${key}Errors`] = formErrors[key];
      });
    },
    '$store.state.order.loading': function (loading) {
      this.loading = loading;
    },
    '$store.state.order.order': function (order) {
      this.order = order;

      if (!_.isEmpty(order)) {
        const { id } = order;
        const status = [order.btc.status, order.rsk.status];
        const allConfirmed = status.every((s) => _.isEqual(s, CONFIRMED));

        this.showOrderSummary = true;
        this.valid = false;

        if (
          (status.includes(PENDING) || status.includes(UNCONFIRMED)) &&
          _.isNull(this.interval)
        ) {
          const ONE_MINUTE_IN_MILISECONDS = 60000;

          this.interval = setInterval(() => {
            this.$store.dispatch('order/get', { id });
          }, ONE_MINUTE_IN_MILISECONDS);
        } else if (allConfirmed) {
          this.removePooling();
        }
      } else {
        if (this.interval) {
          this.removePooling();
        }
      }
    },
  },
  computed: {
    timeToApproved(){
      if(this.value >= 0.2){
        return "2 to 8 hours"
      }
      else if(this.value >= 0.02){
        return "60 to 120 minutes"
      }
      else if(this.value < 0.02 && this.value > 0) {
        return "15 to 30 minutes"
      }else {
        return ""
      }
    }
  }
};
</script>

<style>
.order-alert {
  height: 10px;
  font-size: 14px;
}
</style>