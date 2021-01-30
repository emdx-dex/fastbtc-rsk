import _ from 'lodash';
import { createOrder } from '@/services';

export default {
  namespaced: true,
  state: {
    creating: false,
    error: null,
    loading: false,
    order: {}
  },
  mutations: {
    BEFORE_CREATE(state) {
      state.creating = true;
      state.order = [];
    },
    SUCCESS_CREATE(state, order) {
      state.creating = false;
      state.order = order;
    },
    ERROR_CREATE(state, error) {
      state.creating = false;
      state.error = error;
    },
    BEFORE_FETCH(state) {
      state.creating = true;
      state.order = {};
    },
    SUCCESS_FETCH(state, order) {
      state.loading = false;
      state.order = order;
    },
    ERROR_FETCH(state, error) {
      state.loading = false;
      state.error = error;
    }
  },
  actions: {
    create: async ({ commit }, { rbtcAddress, value }) => {
      commit('BEFORE_CREATE');

      try {
        const response = await createOrder({ rbtcAddress, value });
        const order = _.get(response, 'data.order');

        commit('SUCCESS_CREATE', order);
      } catch (error) {
        commit('ERROR_CREATE', error);
      }
    }
  }
}
