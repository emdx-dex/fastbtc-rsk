<template>
  <page>
    <v-data-table
      :disable-pagination="true"
      :headers="headers"
      :hide-default-footer="true"
      :items="orders"
      :loading="loading"
      class="orders__table"
      item-key="id"
      show-expand
      single-expand
    >
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <order :order="item"></order>
        </td>
      </template>
      <template v-slot:item.status="{ item }">
        <div class="d-flex justify-center align-center">
          <v-icon
            color="success"
            v-if="
              !item.deleted &&
              item.flow === 'RbtcToBtc' && 
              (item.status === 'signature_pending' ||
                item.status === 'multisig_pending')
            "
          >
            mdi-draw
          </v-icon>
          <v-icon v-else-if="item.status === 'deleted'" color="error">
            mdi-trash-can
          </v-icon>
          <span v-else></span>
        </div>
      </template>

      <template v-slot:item.flow="{ item }">
        <span v-if="item.flow === 'btcToRbtc'">BTC -> RBTC</span>
        <span v-else-if="item.flow === 'RbtcToBtc'">RBTC -> BTC</span>
      </template>
    </v-data-table>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import ErrorNotification from '@/components/error-notification';
import moment from 'moment';
import Order from '@/components/order';
import Page from '@/components/page';

export default {
  name: 'Orders',
  components: {
    'error-notification': ErrorNotification,
    Order,
    Page,
  },
  data: () => ({
    expanded: [],
    error: '',
    headers: [
      {
        text: '',
        value: 'status',
        sortable: false,
      },
      {
        class: 'orders__table__row--date',
        text: 'Date',
        value: 'createdAt',
        sortable: false,
      },
      {
        text: 'Order',
        value: 'id',
        sortable: false,
      },
      {
        text: 'Flow',
        value: 'flow',
        sortable: false,
      },
      { text: 'Value', value: 'value', sortable: false },
      { text: '', value: 'data-table-expand' },
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
      const formattedOrders = orders.map(
        ({ btc, createdAt, flow, deleted, id, value, ...order }) => {
          return {
            ...order,
            btc,
            createdAt: moment(createdAt).format('DD/MM/YYYY hh:mm:ss'),
            flow,
            deleted,
            id,
            status: deleted ? 'deleted' : btc.status,
            value,
          };
        }
      );

      this.orders = formattedOrders;
    },
  },
};
</script>
