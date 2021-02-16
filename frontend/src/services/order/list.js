import _ from 'lodash';
import { get } from '../shared';

export default () => {
  return get('/order')
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      const error = _.get(response, 'data.error', 'Error getting the offers');

      throw (error);
    });
}
