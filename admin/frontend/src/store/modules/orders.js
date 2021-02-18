import _ from 'lodash';
import { listOrders, signOrder } from '@/services';

export default {
  namespaced: true,
  state: {
    error: null,
    loading: false,
    orders: []
  },
  mutations: {
    BEFORE_FETCH(state) {
      state.loading = true;
      state.orders = [];
    },
    SUCCESS_FETCH(state, orders) {
      state.loading = false;
      state.orders = orders;
    },
    ERROR_FETCH(state, error) {
      state.loading = false;
      state.error = error;
    },
    BEFORE_SIGN(state) {
      state.loading = true;
    },
    SUCCESS_SIGN(state, order) {
      const { orders } = state;
      const orderIndex = orders.findIndex(({ id }) => id === order.id);

      state.loading = false;
      state.orders = [
        ...orders.slice(0, orderIndex),
        order,
        ...orders.slice(orderIndex + 1),
      ];
    },
    ERROR_SIGN(state, error) {
      state.loading = false;
      state.error = error;
    }
  },
  actions: {
    list: async ({ commit }) => {
      commit('BEFORE_FETCH');

      try {
        const response = await listOrders();
        const orders = _.get(response, 'data.orders', []);

        commit('SUCCESS_FETCH', orders);
      } catch (error) {
        commit('ERROR_FETCH', error);
      }
    },
    sign: async ({ commit }, parameters) => {
      commit('BEFORE_SIGN');

      try {
        const response = await signOrder(parameters);
        const order = _.get(response, 'data.order');

        commit('SUCCESS_SIGN', order);
      } catch (error) {
        commit('ERROR_SIGN', error);
      }
    }
  }
}
