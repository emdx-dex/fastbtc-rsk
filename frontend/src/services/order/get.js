import _ from 'lodash';
import { get } from '../shared';

export default ({ id }) => {
  return get(`/order/${id}`)
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      const error = _.get(response, 'data.error', 'Error getting the order');

      throw (error);
    });
}
