import { StatusIndicator } from 'vue-status-indicator';
import { VTooltip } from 'vuetify/lib';
import STATUS from '../../../common/status';
import Vue from 'vue';

Vue.component('status', {
  components: {
    StatusIndicator,
    VTooltip
  },
  data: () => ({
    pulse: true,
    style: 'intermediary'
  }),
  props: ['status'],
  watch: {
    status: function (newStatus) {
      switch (newStatus) {
        case STATUS.OPEN:
          this.pulse = true;
          this.style = 'intermediary';
          break;

        case STATUS.PENDING:
          this.pulse = true;
          this.style = 'intermediary';
          break;

        case STATUS.CONFIRMED:
          this.pulse = false;
          this.style = 'positive';
          break;

        case STATUS.FAILED:
          this.pulse = false;
          this.style = 'negative';
          break;

        default:
          break;
      }
    }
  },
  template: `
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <span
            v-bind="attrs"
            v-on="on"
          >
            <status-indicator :status="style" :pulse="pulse"></status-indicator>
          </span>
        </template>
        {{ status }}
      </v-tooltip>
  `
});
