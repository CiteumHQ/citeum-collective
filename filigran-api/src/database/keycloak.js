import axios from 'axios';
import conf from '../config/conf';

const api = (token) => {
  const bearer = token.data.access_token;
  return axios.create({
    baseURL: conf.get('keycloak:realm_api'),
    headers: { Authorization: `Bearer ${bearer}` },
    timeout: 1000,
  });
};

const getAdminToken = () => {
  const params = new URLSearchParams();
  params.append('client_id', 'admin-cli');
  params.append('grant_type', 'password');
  params.append('username', conf.get('keycloak:username'));
  params.append('password', conf.get('keycloak:password'));
  const instance = axios.create({
    baseURL: conf.get('keycloak:token_uri'),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 1000,
  });
  return instance.post('/', params);
};

// eslint-disable-next-line import/prefer-default-export
export const userInfo = async (userId) => {
  const token = await getAdminToken();
  const answer = await api(token).get(`/users/${userId}`);
  return answer.data;
};
