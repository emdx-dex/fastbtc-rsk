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
    </v-data-table>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import _ from 'lodash';
import { BTC_TO_RBTC } from '../../../shared/flows';
import moment from 'moment';

export default {
  name: 'Orders',
  data: () => ({
    expanded: [],
    error: '',
    headers: [
      { text: '', value: 'data-table-expand' },
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
        ({ createdAt, flow, id, value, ...order }) => {
          return {
            ...order,
            createdAt: moment(createdAt).format('DD/MM/YYYY hh:mm:ss'),
            flow: flow === BTC_TO_RBTC ? 'BTC -> RBTC' : 'RBTC -> BTC',
            id,
            value,
          };
        }
      );

      this.orders = formattedOrders;
    },
  },
};
</script>
