import _ from 'lodash';
import { createOrder, getOrder } from '@/services';
import { NAMES, set as setCookie } from '@/utils/cookies';

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
      state.loading = true;
    },
    SUCCESS_FETCH(state, order) {
      state.loading = false;
      state.order = order;
    },
    ERROR_FETCH(state, error) {
      state.loading = false;
      state.error = error;
    },
    CLEAN(state) {
      state.order = {};
    }
  },
  actions: {
    clean: ({ commit }) => {
      commit('CLEAN');
    },
    create: async ({ commit }, { rbtcAddress, value }) => {
      commit('BEFORE_CREATE');

      try {
        const response = await createOrder({ rbtcAddress, value });
        const order = _.get(response, 'data.order');

        setCookie(NAMES.ORDER, order.id);

        commit('SUCCESS_CREATE', order);
      } catch (error) {
        commit('ERROR_CREATE', error);
      }
    },
    get: async ({ commit }, { id }) => {
      commit('BEFORE_FETCH');

      try {
        const response = await getOrder({ id });
        const order = _.get(response, 'data.order');

        commit('SUCCESS_FETCH', order);
      } catch (error) {
        commit('ERROR_FETCH', error);
      }
    },
  }
}
