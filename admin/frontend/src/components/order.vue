<template>
  <div class="order">
    <v-container class="lighten-5">
      <v-row>
        <v-col cols="12" md="6">
          <p
            class="order__title subtitle-1 text--primary"
            v-if="rbtcSenderAddress"
          >
            RBTC sender address
          </p>

          <v-row class="d-flex align-center mb-2" v-if="rbtcSenderAddress">
            <v-col class="col-10">
              <span class="font-weight-black">{{ rbtcSenderAddress }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <a
                :href="getRSKAddressUrl(rbtcSenderAddress)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <p class="order__title subtitle-1 text--primary">
            {{ fromCoin() }} deposit address

            <span class="order__title__status">
              <status :status="depositStatus"></status>
            </span>
          </p>

          <v-row class="d-flex align-center mb-2">
            <v-col class="col-10">
              <span class="font-weight-black">{{ depositAddress }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <a
                :href="fromAddressUrl(depositAddress)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <p class="subtitle-1 text--primary" v-if="depositTxId">
            Deposit transaction
          </p>

          <v-row class="d-flex align-center mb-2" v-if="depositTxId">
            <v-col class="col-10">
              <span class="font-weight-black">{{ depositTxId }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <!-- <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(depositTxId)">
                      <v-icon size="18">mdi-content-copy</v-icon>
                    </v-btn> -->
              <a
                :href="fromTxUrl(depositTxId)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <p class="subtitle-1 text--primary">Value</p>

          <p class="font-weight-black headline">{{ value }} {{ fromCoin() }}</p>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="12" md="6">
          <p class="order__title subtitle-1 text--primary">
            {{ toCoin() }} recipient address

            <span class="order__title__status">
              <status :status="transferStatus"></status>
            </span>
          </p>

          <v-row class="d-flex align-center mb-2">
            <v-col class="col-10">
              <span class="font-weight-black">{{ transferAddress }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <!-- <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(transferAddress)">
                    <v-icon size="18">mdi-content-copy</v-icon>
                  </v-btn> -->
              <a
                :href="toAddressUrl(transferAddress)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <p class="subtitle-1 text--primary" v-if="transferTxId">
            Recipient transaction
          </p>

          <v-row
            class="d-flex align-center mb-2 light-grey"
            v-if="transferTxId"
          >
            <v-col class="col-10">
              <span class="font-weight-black">{{ transferTxId }}</span>
            </v-col>
            <v-col class="col-2 d-flex align-center justify-center">
              <!-- <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(transferTxId)">
                    <v-icon size="18">mdi-content-copy</v-icon>
                  </v-btn> -->
              <a
                :href="toTxUrl(transferTxId)"
                target="_blank"
                style="text-decoration: none"
              >
                <v-btn x-small>
                  <v-icon size="18">mdi-arrow-top-right</v-icon>
                </v-btn>
              </a>
            </v-col>
          </v-row>

          <p class="subtitle-1 text--primary">Value</p>

          <p class="font-weight-black headline">{{ netValue }} {{ toCoin() }}</p>

          <div
            v-if="
              !deleted &&
              flow === 'RbtcToBtc' &&
              (transferStatus.status === 'signature_pending' ||
                transferStatus.status === 'multisig_pending')
            "
          >
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                :rules="txInputRules"
                label="Transaction ID"
                v-model="txInput"
              ></v-text-field>
              <v-btn
                :disabled="!valid"
                @click="submit"
                class="mr-4"
                color="success"
              >
                submit
              </v-btn>
            </v-form>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash';
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../../shared/flows';
import { getBTCAddressUrl, getBTCTxUrl } from '@/utils/btc-urls';
import { getRSKAddressUrl, getRSKTxUrl } from '@/utils/rsk-urls';
import Status from '@/components/status';
import SYMBOLS from '../../../../shared/symbols';

export default {
  name: 'order',
  components: {
    Status,
  },
  data: () => ({
    confirmations: '',
    coin: '',
    deleted: false,
    depositAddress: '',
    depositStatus: {},
    depositTxId: '',
    flow: '',
    id: '',
    netValue: '',
    rbtcSenderAddress: false,
    requiredConfirmations: '',
    transferAddress: '',
    transferStatus: {},
    transferTxId: '',
    txId: '',
    txInput: '',
    txInputRules: [(v) => !_.isEmpty(v) || 'Transaction ID is required.'],
    valid: false,
    value: '',
  }),
  mounted: function () {
    this.initialize(this.order);
  },
  methods: {
    copyToClipboard: async function (text) {
      const method = await navigator.clipboard.writeText(text);

      return method(text);
    },
    fromAddressUrl: function (url) {
      const method =
        this.flow === BTC_TO_RBTC ? getBTCAddressUrl : getRSKAddressUrl;

      return method(url);
    },
    fromTxUrl: function (url) {
      const method = this.flow === BTC_TO_RBTC ? getBTCTxUrl : getRSKTxUrl;

      return method(url);
    },
    fromCoin: function () {
      return this.flow === BTC_TO_RBTC ? SYMBOLS.BTC : SYMBOLS.RBTC;
    },
    getRSKAddressUrl,
    initialize: function (order) {
      if (!_.isEmpty(order)) {
        const { id, deleted, flow, netValue, value } = order;
        const fromChain = flow === BTC_TO_RBTC ? 'btc' : 'rsk';
        const toChain = flow === BTC_TO_RBTC ? 'rsk' : 'btc';

        this.coin = flow === BTC_TO_RBTC ? SYMBOLS.BTC : SYMBOLS.RBTC;
        this.deleted = deleted;
        this.depositAddress = order[fromChain].address;
        this.depositStatus = {
          confirmations: order[fromChain].confirmations,
          requiredConfirmations: order[fromChain].requiredConfirmations,
          status: order[fromChain].status,
        };
        this.depositTxId = order[fromChain].txId;
        this.flow = flow;
        this.id = id;
        this.netValue = netValue;
        this.rbtcSenderAddress =
          flow === RBTC_TO_BTC ? order.rsk.senderAddress : false;
        this.transferAddress = order[toChain].address;
        this.transferStatus = {
          confirmations: order[toChain].confirmations,
          requiredConfirmations: order[toChain].requiredConfirmations,
          status: order[toChain].status,
        };
        this.transferTxId = order[toChain].txId;
        this.value = value;
      }
    },
    submit: function () {
      const { id, txInput } = this;
      const valid = this.$refs.form.validate();

      if (valid) {
        this.valid = false;

        this.$store.dispatch('orders/sign', { id, txId: txInput });
      }
    },
    toCoin: function () {
      return this.flow === BTC_TO_RBTC ? SYMBOLS.RBTC : SYMBOLS.BTC;
    },
    toTxUrl: function (url) {
      const method = this.flow === BTC_TO_RBTC ? getRSKTxUrl : getBTCTxUrl;

      return method(url);
    },
    toAddressUrl: function (url) {
      const method =
        this.flow === BTC_TO_RBTC ? getRSKAddressUrl : getBTCAddressUrl;

      return method(url);
    },
  },
  props: ['order'],
  watch: {
    order: function (newOrder) {
      this.initialize(newOrder);
    },
  },
};
</script>
