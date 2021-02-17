<template>
  <div class="page">
    <v-card class="mx-auto" max-width="1024" elevation="0">
      <slot />
    </v-card>
  </div>
</template>

<script>
// import { VCard } from 'vuetify/lib';

export default {
  name: 'page',
  // components: {
  //   VCard,
  // },
};
</script>
