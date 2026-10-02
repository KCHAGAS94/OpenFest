import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// O backend roda no PC conectado à impressora. O celular precisa estar
// na mesma rede Wi-Fi e apontar para o IP local desse PC.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    'EXPO_PUBLIC_API_URL não definido. Configure o arquivo .env na pasta mobile/ (veja .env.example).'
  );
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@openfest:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
