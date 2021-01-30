import { VCard } from 'vuetify/lib';
import Vue from 'vue';

Vue.component('page', {
  components: {
    VCard
  },
  template: `
  <div class="page">
    <v-card class="mx-auto" max-width="1024" elevation="0">
      <slot />
    </v-card>
  </div>
  `
});
