import { get } from '../shared';

export default ({ id }) => {
  return get(`/order/${id}`)
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      throw (response.data.error);
    });
}
