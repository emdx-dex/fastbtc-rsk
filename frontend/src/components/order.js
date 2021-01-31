import _ from 'lodash';
import { getAddressUrl, getTxUrl } from '@/utils/btc-urls';
import { getAddressUrl as getRSKAddressUrl } from '@/utils/rsk-urls';
import { VCard, VCardText } from 'vuetify/lib';
import Vue from 'vue';

Vue.component('order', {
  components: {
    VCard,
    VCardText
  },
  data: () => ({
    btcDepositAddress: '',
    rbtcTransferAddress: '',
    show: '',
    showOrder: false,
    status: '',
    txId: '',
    value: '',
  }),
  filters: {
    btcAddressUrl: function (value) {
      return getAddressUrl(value);
    },
    btcTxUrl: function (value) {
      return getTxUrl(value);
    },
    rbtcAddressUrl: function (value) {
      return getRSKAddressUrl(value);
    },
  },
  watch: {
    '$store.state.order.order': function (order) {
      if (!_.isEmpty(order)) {
        const { btcDepositAddress, rbtcTransferAddress, status, txId, value } = order;

        this.btcDepositAddress = btcDepositAddress;
        this.rbtcTransferAddress = rbtcTransferAddress;
        this.showOrder = true;
        this.status = status;
        this.txId = txId;
        this.value = value;
      } else {
        this.showOrder = false;
      }
    }
  },
  template: `
  <div class="order" v-if="showOrder">
    <v-card
      elevation="2"
    >
      <v-card-text>
        <p class="title text--primary">
          Order created succcessfully 
          <span class="order__status">
            <status :status="status" ></status>
          </span>
        </p>

        <p class="subtitle-1 text--primary">
          BTC deposit address
        </p>
        
        <p class="font-weight-black headline">
          <a :href="btcDepositAddress | btcAddressUrl" target="_blank">
            {{ btcDepositAddress }}
          </a>
        </p>

        <p class="subtitle-1 text--primary">
          Value
        </p>
        
        <p class="font-weight-black headline">
          {{ value }} BTC
        </p>

        <p class="subtitle-1 text--primary">
          RBTC recipient address
        </p>
        
        <p class="font-weight-black headline">
          <a :href="rbtcTransferAddress | rbtcAddressUrl" target="_blank">
            {{ rbtcTransferAddress }}
          </a>
        </p>

        <p class="subtitle-1 text--primary" v-if="txId">
          Transaction
        </p>
        
        <p class="font-weight-black headline" v-if="txId">
          <a :href="txId | btcTxUrl" target="_blank">
            {{ txId }}
          </a>
        </p>
      </v-card-text>
    </v-card>
  </div>
  `
});
