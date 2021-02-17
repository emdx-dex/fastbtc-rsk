<template>
  <v-snackbar v-model="open" :multi-line="true">
    {{ error }}

    <template v-slot:action="{ attrs }">
      <v-btn color="red" text v-bind="attrs" @click="open = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import _ from 'lodash';
// import { VBtn, VSnackbar } from 'vuetify/lib';

export default {
  name: 'error-notification',
  // components: {
  //   VBtn,
  //   VSnackbar,
  // },
  data: () => ({
    open: false,
  }),
  props: ['error'],
  watch: {
    error: function (newVal, oldVal) {
      if (!_.isEqual(newVal, oldVal)) {
        this.open = true;
      }
    },
  },
};
</script>
