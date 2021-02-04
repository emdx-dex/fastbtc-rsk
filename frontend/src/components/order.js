import _ from 'lodash';
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../shared/flows';
import { getBTCAddressUrl, getBTCTxUrl } from '@/utils/btc-urls';
import { getRSKAddressUrl, getRSKTxUrl } from '@/utils/rsk-urls';
import { VCardText, VIcon } from 'vuetify/lib';
import SYMBOLS from '../../../shared/symbols';
import Vue from 'vue';

Vue.component('order', {
  components: { VCardText, VIcon },
  data: () => ({
    confirmations: '',
    coin: '',
    depositAddress: '',
    depositStatus: {},
    depositTxId: '',
    flow: '',
    rbtcSenderAddress: false,
    requiredConfirmations: '',
    show: '',
    showOrder: false,
    transferAddress: '',
    transferStatus: {},
    transferTxId: '',
    txId: '',
    value: '',
  }),
  mounted: function () {
    this.initialize(this.order);
  },
  methods: {
    fromAddressUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getBTCAddressUrl : getRSKAddressUrl;

      return method(url);
    },
    fromTxUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getBTCTxUrl : getRSKTxUrl;

      return method(url);
    },
    fromCoin: function () {
      return (this.flow === BTC_TO_RBTC) ? SYMBOLS.BTC : SYMBOLS.RBTC;
    },
    getRSKAddressUrl,
    initialize: function (order) {
      if (!_.isEmpty(order)) {
        const { flow, value } = order;
        const fromChain = (flow === BTC_TO_RBTC) ? 'btc' : 'rsk';
        const toChain = (flow === BTC_TO_RBTC) ? 'rsk' : 'btc';

        this.coin = (flow === BTC_TO_RBTC) ? SYMBOLS.BTC : SYMBOLS.RBTC
        this.depositAddress = order[fromChain].address;
        this.depositStatus = {
          confirmations: order[fromChain].confirmations,
          requiredConfirmations: order[fromChain].requiredConfirmations,
          status: order[fromChain].status
        };
        this.depositTxId = order[fromChain].txId;
        this.flow = flow;
        this.rbtcSenderAddress = (flow === RBTC_TO_BTC) ? order.rsk.senderAddress : false;
        this.showOrder = true;
        this.transferAddress = order[toChain].address;
        this.transferStatus = {
          confirmations: order[toChain].confirmations,
          requiredConfirmations: order[toChain].requiredConfirmations,
          status: order[toChain].status
        };
        this.transferTxId = order[toChain].txId;
        this.value = value;
      } else {
        this.showOrder = false;
      }
    },
    toCoin: function () {
      return (this.flow === BTC_TO_RBTC) ? SYMBOLS.RBTC : SYMBOLS.BTC;
    },
    toTxUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getRSKTxUrl : getBTCTxUrl;

      return method(url);
    },
    toAddressUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getRSKAddressUrl : getBTCAddressUrl;

      return method(url);
    },
  },
  props: ['order'],
  watch: {
    'order': function (newOrder) {
      this.initialize(newOrder);
    }
  },
  template: `
  <div class="order" v-if="showOrder">
    <v-card-text>
      <p class="title text--primary">
        Order created succcessfully
      </p>

      <p class="order__title subtitle-1 text--primary" v-if="rbtcSenderAddress">
        RBTC sender address
      </p>
      
      <p class="font-weight-black headline" v-if="rbtcSenderAddress">
        <a :href="getRSKAddressUrl(rbtcSenderAddress)" target="_blank">
          {{ rbtcSenderAddress }}
        </a>
      </p>

      <p class="order__title subtitle-1 text--primary">
        {{ fromCoin() }} deposit address

        <span class="order__title__status">
          <status :status="depositStatus" ></status>
        </span>
      </p>
      
      <p class="font-weight-black headline">
        <a :href="fromAddressUrl(depositAddress)" target="_blank">
          {{ depositAddress }}
        </a>
      </p>

      <p class="subtitle-1 text--primary">
        Value
      </p>
      
      <p class="font-weight-black headline">
        {{ value }} {{ fromCoin() }}  
        
        <v-icon color="black" large> mdi-arrow-right-thick </v-icon>
        
        {{ value }} {{ toCoin() }}
      </p>

      <p class="order__title subtitle-1 text--primary">
        {{ toCoin() }} recipient address

        <span class="order__title__status">
          <status :status="transferStatus" ></status>
        </span>
      </p>
      
      <p class="font-weight-black headline">
        <a :href="toAddressUrl(transferAddress)" target="_blank">
          {{ transferAddress }}
        </a>
      </p>

      <p class="subtitle-1 text--primary" v-if="depositTxId">
        Deposit transaction
      </p>
      
      <p class="font-weight-black headline" v-if="depositTxId">
        <a :href="fromTxUrl(depositTxId)" target="_blank">
          {{ depositTxId }}
        </a>
      </p>

      <p class="subtitle-1 text--primary" v-if="transferTxId">
        Recipient transaction
      </p>
      
      <p class="font-weight-black headline" v-if="transferTxId">
        <a :href="toTxUrl(transferTxId)" target="_blank">
          {{ transferTxId }}
        </a>
      </p>
    </v-card-text>
  </div>
  `
});
