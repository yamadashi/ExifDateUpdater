import axios, { AxiosResponse } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL
if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not set')
}

const axiosInstance = axios.create({
  baseURL,
  timeout: 60 * 1000,
})

export default axiosInstance

export type Response<T> = AxiosResponse<T>
