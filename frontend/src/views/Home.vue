<template>
  <div class="home">
    <page>
      <v-form ref="form">
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
        ></v-text-field>
        <v-btn class="mr-4" type="submit" @click="submit"> submit </v-btn>
      </v-form>
    </page>
  </div>
</template>

<script>
import { createOrder } from "@/services";
import isNaN from "lodash/isNaN";
import Page from "@/components/page.vue";

export default {
  name: "Home",
  components: {
    Page,
  },
  data: () => ({
    rbtcAddress: "",
    rbtcAddressRule: [(v) => v !== ""],
    valid: false,
    value: "",
    valueRule: [(v) => !isNaN(Number(v))],
  }),
  methods: {
    submit(event) {
      // TODO: Make validation work.
      const { rbtcAddress, value } = this;

      event.preventDefault();

      createOrder({ rbtcAddress, value });
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
}
</style>
