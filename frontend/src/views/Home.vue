<template>
  <page>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field
        v-model="rbtcAddress"
        :rules="rbtcAddressRule"
        label="RBTC address"
        required
      ></v-text-field>
      <v-text-field
        v-model="value"
        :rules="valueRule"
        label="Value"
        required
        single-line
        type="number"
      ></v-text-field>
      <v-btn
        class="home__form__submit mr-4"
        :disabled="!valid"
        color="success"
        @click="submit"
      >
        submit
      </v-btn>
    </v-form>
    <error-notification :error="error"></error-notification>
  </page>
</template>

<script>
export default {
  name: 'Home',
  data: () => ({
    alert: false,
    error: '',
    rbtcAddress: '',
    rbtcAddressRule: [(v) => v !== '' || 'Address is required.'],
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
      console.log(order);
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
  &__form {
    &__submit {
      margin-top: 20px;
    }
  }
}
</style>
