import { get } from '../shared';

export default () => {
  return get('/order')
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      throw (response.data.error);
    });
}
