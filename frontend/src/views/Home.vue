<template>
  <div class="home">
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
          hide-details
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
    </page>
  </div>
</template>

<script>
import { createOrder } from '@/services';
import isNaN from 'lodash/isNaN';
import Page from '@/components/page.vue';

export default {
  name: 'Home',
  components: {
    Page,
  },
  data: () => ({
    alert: false,
    rbtcAddress: '',
    rbtcAddressRule: [(v) => v !== '' || 'Address is required.'],
    valid: false,
    value: '',
    valueRule: [
      (v) => v !== '' || 'Value is required.',
      (v) => !isNaN(Number(v)) || 'Value should be a number.',
      (v) => v > 0 || 'Value should be greater than 0.',
    ],
  }),
  methods: {
    submit() {
      const { rbtcAddress, value } = this;
      const valid = this.$refs.form.validate();

      this.alert = true;

      if (valid) {
        createOrder({ rbtcAddress, value });
      }
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
