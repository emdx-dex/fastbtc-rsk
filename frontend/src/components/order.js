import { getAddressUrl } from '@/utils/btc-urls';
import { getAddressUrl as getRSKAddressUrl } from '@/utils/rsk-urls';
import { VCard, VCardText } from 'vuetify/lib';
import Vue from 'vue';

Vue.component('order', {
  components: {
    VCard,
    VCardText
  },
  data: () => ({
    btcAddressUrl: '',
    rbtcTransferAddressUrl: ''
  }),
  props: ['btcDepositAddress', 'rbtcTransferAddress', 'show', 'status', 'value'],
  watch: {
    btcDepositAddress: function (btcDepositAddress) {
      this.btcAddressUrl = getAddressUrl(btcDepositAddress);
    },
    rbtcTransferAddress: function (rbtcTransferAddress) {
      this.rbtcTransferAddressUrl = getRSKAddressUrl(rbtcTransferAddress);
    },
  },
  template: `
  <div class="order" v-if="show">
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
          <a :href="btcAddressUrl" target="_blank">
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
          <a :href="rbtcTransferAddressUrl" target="_blank">
            {{ rbtcTransferAddress }}
          </a>
        </p>
      </v-card-text>
    </v-card>
  </div>
  `
});
