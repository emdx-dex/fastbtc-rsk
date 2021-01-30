import { VCard, VCardText } from 'vuetify/lib';
import Vue from 'vue';
import { getAddressUrl } from '@/utils/btc-urls';
import { getAddressUrl as getRSKAddressUrl } from '@/utils/rsk-urls';

Vue.component('order', {
  components: {
    VCard,
    VCardText
  },
  data: () => ({
    btcAddressUrl: '',
    rbtcAddressUrl: '',
  }),
  props: ['btcDepositAddress', 'rbtcAddress', 'show', 'value'],
  watch: {
    btcDepositAddress: function (btcDepositAddress) {
      this.btcAddressUrl = getAddressUrl(btcDepositAddress);
    },
    rbtcAddress: function (rbtcAddress) {
      this.rbtcAddressUrl = getRSKAddressUrl(rbtcAddress);
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
          <a :href="rbtcAddressUrl" target="_blank">
            {{ rbtcAddress }}
          </a>
        </p>
      </v-card-text>
    </v-card>
  </div>
  `
});
