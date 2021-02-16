import _ from 'lodash';
import { BTC_TO_RBTC, RBTC_TO_BTC } from '../../../shared/flows';
import { getBTCAddressUrl, getBTCTxUrl } from '@/utils/btc-urls';
import { getRSKAddressUrl, getRSKTxUrl } from '@/utils/rsk-urls';
import { VCard, VCardText, VCol, VContainer, VIcon, VRow, VSpacer, VBtn } from 'vuetify/lib';
import SYMBOLS from '../../../shared/symbols';
import Vue from 'vue';

Vue.component('order', {
  components: { VCard, VCardText, VCol, VContainer, VIcon, VRow, VSpacer, VBtn},
  data: () => ({
    confirmations: '',
    coin: '',
    depositAddress: '',
    depositStatus: {},
    depositTxId: '',
    flow: '',
    rbtcSenderAddress: false,
    requiredConfirmations: '',
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
        this.transferAddress = order[toChain].address;
        this.transferStatus = {
          confirmations: order[toChain].confirmations,
          requiredConfirmations: order[toChain].requiredConfirmations,
          status: order[toChain].status
        };
        this.transferTxId = order[toChain].txId;
        this.value = value;
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
    copyToClipboard: async (text) => {
      const method = await navigator.clipboard.writeText(text)

      return method(text)
    }
  },
  props: ['order'],
  watch: {
    'order': function (newOrder) {
      this.initialize(newOrder);
    }
  },
  template: `
    <div class="order">
      <v-container class="lighten-5">
        <v-row>
          <v-col cols="12" md="6">
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

              <v-row class="d-flex align-center mb-2 light-grey">
                <v-col class="d-flex flex-grow-0 flex-shrink-1 font-weight-black align-center">
                  {{ depositAddress }}
                </v-col>
                <v-col class="d-flex flex-grow-1 flex-shrink-0 align-center justify-center">
                    <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(depositAddress)">
                      <v-icon size="18">mdi-content-copy</v-icon>
                    </v-btn>
                  <a :href="fromAddressUrl(depositAddress)" target="_blank" style="text-decoration: none">
                    <v-btn x-small>
                      <v-icon size="18">mdi-arrow-top-right</v-icon>
                    </v-btn>
                  </a>
                </v-col>
              </v-row>
        
              <p class="subtitle-1 text--primary" v-if="depositTxId">
                Deposit transaction
              </p>

              <v-row class="d-flex align-center mb-2 light-grey" v-if="depositTxId">
                <v-col class="d-flex flex-grow-0 flex-shrink-1 font-weight-black align-center">
                  {{ depositTxId }}
                </v-col>
                <v-col class="d-flex flex-grow-1 flex-shrink-0 align-center justify-center">
                    <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(depositTxId)">
                      <v-icon size="18">mdi-content-copy</v-icon>
                    </v-btn>
                  <a :href="fromTxUrl(depositTxId)" target="_blank" style="text-decoration: none">
                    <v-btn x-small>
                      <v-icon size="18">mdi-arrow-top-right</v-icon>
                    </v-btn>
                  </a>
                </v-col>
              </v-row>
        
              <p class="subtitle-1 text--primary">
                Value
              </p>
              
              <p class="font-weight-black headline">
                {{ value }} {{ fromCoin() }}                
              </p>
          </v-col>

          <v-spacer></v-spacer>

          <v-col cols="12" md="6">
            <p class="order__title subtitle-1 text--primary">
              {{ toCoin() }} recipient address

              <span class="order__title__status">
                <status :status="transferStatus" ></status>
              </span>
            </p>

            <v-row class="d-flex align-center mb-2 light-grey">
              <v-col class="d-flex flex-grow-0 flex-shrink-1 font-weight-black align-center">
                {{ transferAddress }}
              </v-col>
              <v-col class="d-flex flex-grow-1 flex-shrink-0 align-center justify-center">
                  <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(transferAddress)">
                    <v-icon size="18">mdi-content-copy</v-icon>
                  </v-btn>
                <a :href="toAddressUrl(transferAddress)" target="_blank" style="text-decoration: none">
                  <v-btn x-small>
                    <v-icon size="18">mdi-arrow-top-right</v-icon>
                  </v-btn>
                </a>
              </v-col>
            </v-row>

            <p class="subtitle-1 text--primary" v-if="transferTxId">
              Recipient transaction
            </p>

            <v-row class="d-flex align-center mb-2 light-grey" v-if="transferTxId">
              <v-col class="d-flex flex-grow-0 flex-shrink-1 font-weight-black align-center">
                {{ transferTxId }}
              </v-col>
              <v-col class="d-flex flex-grow-1 flex-shrink-0 align-center justify-center">
                  <v-btn x-small class="mr-2" :nativeOnClick="copyToClipboard(transferTxId)">
                    <v-icon size="18">mdi-content-copy</v-icon>
                  </v-btn>
                <a :href="toTxUrl(transferTxId)" target="_blank" style="text-decoration: none">
                  <v-btn x-small>
                    <v-icon size="18">mdi-arrow-top-right</v-icon>
                  </v-btn>
                </a>
              </v-col>
            </v-row>
            

            <p class="subtitle-1 text--primary">
              Value
            </p>
            
            <p class="font-weight-black headline">
              {{ value }} {{ toCoin() }}
            </p>
          </v-col>
        </v-row>
      </v-container>
    </div>
  `
});
