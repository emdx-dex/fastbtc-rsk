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
          <status-indicator
            :status="statusMapper[item.status]"
            :pulse="pulse"
          ></status-indicator>
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
import { StatusIndicator } from 'vue-status-indicator';

const statusMapper = {
  pending: 'intermediary',
  signature_pending: 'intermediary',
  multisig_pending: 'intermediary',
  unconfirmed: 'active',
  confirmed: 'positive',
  failed: 'negative',
  deleted: '',
};

export default {
  name: 'Orders',
  components: {
    'error-notification': ErrorNotification,
    StatusIndicator,
    Order,
    Page,
  },
  data: () => ({
    expanded: [],
    error: '',
    statusMapper: statusMapper,
    headers: [
      {
        text: 'Status',
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
    style: 'active',
    pulse: true,
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
        ({ btc, rsk, createdAt, flow, deleted, id, value, ...order }) => {
          let properStatus;

          if (deleted) 
            properStatus = 'deleted';
          else {
            if (flow == 'btcToRbtc') 
              properStatus = rsk.status;
            else 
              properStatus = btc.status;
          }

          return {
            ...order,
            btc,
            createdAt: moment(createdAt).format('DD/MM/YYYY hh:mm:ss'),
            flow,
            deleted,
            id,
            rsk,
            status: properStatus,
            value,
          };
        }
      );

      this.orders = formattedOrders;
    },
  },
};
</script>
