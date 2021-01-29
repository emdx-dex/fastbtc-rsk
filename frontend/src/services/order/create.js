import { post } from "../shared";

export default (order) => {
  return post('/order', order)
    .then(({ data }) => {
      return data;
    })
    .catch(({ response }) => {
      throw (response.data.error);
    });
}
