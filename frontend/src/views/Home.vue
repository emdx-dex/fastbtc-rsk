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
      <v-btn
        :disabled="!valid"
        @click="submit"
        class="home__form__submit mr-4"
        color="success"
      >
        submit
      </v-btn>
    </v-form>
    <div class="home__ordersummary">
      <order
        :btcDepositAddress="btcDepositAddress"
        :rbtcAddress="rbtcAddress"
        :show="show"
        :status="status"
        :value="value"
      ></order>
    </div>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'Home',
  data: () => ({
    btcDepositAddress: '',
    error: '',
    rbtcAddress: '',
    rbtcAddressRule: [(v) => v !== '' || 'Address is required.'],
    show: false,
    status: '',
    valid: false,
    value: '',
    valueRule: [
      (v) => v !== '' || 'Value is required.',
      (v) => v > 0 || 'Value should be greater than 0.',
    ],
  }),
  methods: {
    async submit() {
      const { rbtcAddress, value } = this;
      const valid = this.$refs.form.validate();

      if (valid) {
        this.$store.dispatch('order/create', { rbtcAddress, value });
      }
    },
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
        const { btcDepositAddress, status, value } = order;

        this.btcDepositAddress = btcDepositAddress;
        this.show = true;
        this.status = status;
        this.value = value;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
  $TOP_MARGIN: 20px;

  &__form {
    &__submit {
      margin-top: $TOP_MARGIN;
    }
  }
  &__ordersummary {
    margin-top: $TOP_MARGIN;
  }
}
</style>
