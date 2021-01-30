import _ from 'lodash';
import { listOrders } from '@/services';

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
    }
  }
}
