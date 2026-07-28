import axios, { AxiosResponse } from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  timeout: 60 * 1000,
})

export default axiosInstance

export type Response<T> = AxiosResponse<T>
