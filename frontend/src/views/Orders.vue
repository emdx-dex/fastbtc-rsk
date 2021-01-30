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
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';

export default {
  name: 'Orders',
  data: () => ({
    error: '',
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
      { text: 'Status', value: 'status', sortable: false },
    ],
    loading: false,
    orders: [],
  }),
  mounted: async function () {
    this.$store.dispatch('orders/list');
  },
  watch: {
    '$store.state.orders.error': function (error) {
      this.error = error;
    },
    '$store.state.orders.loading': function (loading) {
      this.loading = loading;
    },
    '$store.state.orders.orders': function (orders) {
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
    },
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
