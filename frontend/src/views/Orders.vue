<template>
  <page>
    <v-data-table
      :disable-pagination="true"
      :headers="headers"
      :hide-default-footer="true"
      :items="orders"
      :loading="loading"
      class="orders__table"
    ></v-data-table>
  </page>
</template>

<script>
import _ from 'lodash';
import { listOrders } from '@/services';
import moment from 'moment';
import Page from '@/components/page.vue';

export default {
  name: 'Orders',
  components: {
    Page,
  },
  data: () => ({
    headers: [
      {
        class: 'orders__table__row--date',
        text: 'Date',
        value: 'createdAt',
        sortable: false,
      },
      {
        text: 'BTC deposit address',
        value: 'btcDepositAddress',
        sortable: false,
      },
      {
        text: 'RBTC Transfer Address',
        value: 'rbtcTransferAddress',
        sortable: false,
      },
      { text: 'Value', value: 'value', sortable: false },
      { text: 'Tx ID', value: 'txId', sortable: false },
      { text: 'Statud', value: 'status', sortable: false },
    ],
    loading: false,
    orders: [],
  }),
  mounted: async function () {
    try {
      this.loading = true;
      const response = await listOrders();
      this.loading = false;
      const orders = _.get(response, 'data.orders', []);
     
     // TODO: Render address and txs as urls.
      const formattedOrders = orders.map(
        ({
          createdAt,
          btcDepositAddress,
          rbtcTransferAddress,
          value,
          txId,
          status,
        }) => {
          return {
            createdAt: moment(createdAt).format('DD MM YYYY hh:mm:ss'),
            btcDepositAddress,
            rbtcTransferAddress,
            value,
            txId,
            status: _.capitalize(status),
          };
        }
      );

      this.orders = formattedOrders;
    } catch (error) {
      console.log(error);

      this.loading = false;
    }
  },
};
</script>

<style lang="scss">
.orders {
  &__table {
    td {
      white-space: nowrap !important;
    }
  }
}
</style>
