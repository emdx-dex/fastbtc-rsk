import _ from 'lodash';
import { put } from '../shared';

export default (parameters) => {
  return put('/order', parameters)
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      const error = _.get(response, 'data.error', 'Wrong transaction ID.');

      throw (error);
    });
}
