import _ from 'lodash';
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../shared/flows';
import { getBTCAddressUrl, getBTCTxUrl } from '@/utils/btc-urls';
import { getRSKAddressUrl, getRSKTxUrl } from '@/utils/rsk-urls';
import { VCardText } from 'vuetify/lib';
import SYMBOLS from '../../../shared/symbols';
import Vue from 'vue';

Vue.component('order', {
  components: { VCardText },
  data: () => ({
    confirmations: '',
    coin: '',
    depositAddress: '',
    flow: '',
    requiredConfirmations: '',
    show: '',
    showOrder: false,
    status: '',
    transferAddress: '',
    txId: '',
    value: '',
  }),
  mounted: function () {
    this.initialize();
  },
  methods: {
    fromAddressUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getRSKAddressUrl : getBTCAddressUrl;

      return method(url);
    },
    fromCoin: function () {
      return (this.flow === BTC_TO_RBTC) ? SYMBOLS.BTC : SYMBOLS.RBTC;
    },
    initialize: function () {
      const { order } = this

      if (!_.isEmpty(order)) {
        const { flow, txId, value } = order;
        const fromChain = (flow === BTC_TO_RBTC) ? 'btc' : 'rsk';
        const toChain = (flow === BTC_TO_RBTC) ? 'rsk' : 'btc';

        this.depositAddress = order[fromChain].address;
        this.transferAddress = order[toChain].address;
        this.coin = (flow === BTC_TO_RBTC) ? SYMBOLS.BTC : SYMBOLS.RBTC
        this.showOrder = true;
        this.txId = txId;
        this.value = value;
      } else {
        this.showOrder = false;
      }
    },
    toCoin: function () {
      return (this.flow === BTC_TO_RBTC) ? SYMBOLS.RBTC : SYMBOLS.BTC;
    },
    txUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getBTCTxUrl : getRSKTxUrl;

      return method(url);
    },
    toAddressUrl: function (url) {
      const method = (this.flow === BTC_TO_RBTC) ? getBTCAddressUrl : getRSKAddressUrl;

      return method(url);
    },
  },
  props: ['order'],
  watch: {
    'order': function () {
      this.initialize();
    }
  },
  template: `
  <div class="order" v-if="showOrder">
    <v-card-text>
      <p class="title text--primary">
        Order created succcessfully 
        <span class="order__status">
          <status :status="status" ></status>
        </span>
      </p>

      <p class="subtitle-1 text--primary">
        {{ fromCoin() }} deposit address
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
      </p>

      <p class="subtitle-1 text--primary">
        {{ toCoin() }} recipient address
      </p>
      
      <p class="font-weight-black headline">
        <a :href="toAddressUrl(transferAddress)" target="_blank">
          {{ transferAddress }}
        </a>
      </p>

      <p class="subtitle-1 text--primary" v-if="txId">
        Transaction
      </p>
      
      <p class="font-weight-black headline" v-if="txId">
        <a :href="txUrl(txId)" target="_blank">
          {{ txId }}
        </a>
      </p>
    </v-card-text>
  </div>
  `
});
