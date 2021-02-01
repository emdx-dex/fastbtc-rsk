<template>
  <page>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field
        :rules="rbtcAddressRule"
        label="RBTC address"
        required
        v-model="rbtcAddress"
      ></v-text-field>
      <v-text-field
        :rules="valueRule"
        label="Value"
        required
        single-line
        type="number"
        v-model="value"
      ></v-text-field>
      <div class="home__form__footer">
        <v-btn :disabled="!valid" @click="submit" class="mr-4" color="success">
          submit
        </v-btn>
        <v-btn @click="clear" class="mr-4"> clear order </v-btn>
      </div>
    </v-form>
    <div class="home__ordersummary">
      <order></order>
    </div>
    <confirmation-dialog
      :onCancel="handleCancel"
      :onConfirm="handleConfirm"
      :show="showConfirmationDialog"
    ></confirmation-dialog>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import _ from 'lodash';
import {
  get as getCookie,
  NAMES,
  remove as removeCookie,
} from '@/utils/cookies';
import STATUS from '@/utils/status';

export default {
  name: 'Home',
  data: () => ({
    error: '',
    interval: null,
    rbtcAddress: '',
    rbtcAddressRule: [(v) => !_.isEmpty(v) || 'Address is required.'],
    showConfirmationDialog: false,
    valid: false,
    value: '',
    valueRule: [
      (v) => !_.isEmpty(v) || 'Value is required.',
      (v) => v > 0 || 'Value should be greater than 0.',
    ],
  }),
  methods: {
    async clear() {
      this.showConfirmationDialog = true;
    },
    handleCancel() {
      this.showConfirmationDialog = false;
    },
    handleConfirm() {
      removeCookie(NAMES.ORDER);

      this.$refs.form.reset();
      this.$refs.form.resetValidation();
      this.$store.dispatch('order/clean');
      this.showConfirmationDialog = false;
      this.valid = true;

      this.removePooling();
    },
    removePooling() {
      clearInterval(this.interval);

      this.interval = null;
    },
    async submit() {
      const { rbtcAddress, value } = this;
      const valid = this.$refs.form.validate();

      if (valid) {
        this.valid = false;
        this.$store.dispatch('order/create', { rbtcAddress, value });
      }
    },
  },
  mounted: async function () {
    const order = getCookie(NAMES.ORDER);

    if (!_.isEmpty(order)) {
      this.$store.dispatch('order/get', { id: order });
    }
  },
  watch: {
    '$store.state.order.error': function (error) {
      this.error = error;
    },
    '$store.state.order.loading': function (loading) {
      this.loading = loading;
    },
    '$store.state.order.order': function (order) {
      if (!_.isEmpty(order)) {
        const { id, status } = order;

        this.valid = false;

        if (
          (status === STATUS.OPEN || status === STATUS.PENDING) &&
          _.isNull(this.interval)
        ) {
          this.interval = setInterval(() => {
            this.$store.dispatch('order/get', { id });
          }, 10000);
        } else if (status === STATUS.CONFIRMED || status === STATUS.FAILED) {
          this.removePooling();
        }
      } else {
        if (this.interval) {
          this.removePooling();
        }
      }
    },
  },
};
</script>
