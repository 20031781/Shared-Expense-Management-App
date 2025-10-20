import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthTokens, ApiError } from '@/types';
import { StorageService } from './storage.service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const tokens = await this.storageService.getTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.storageService.getTokens();
            if (tokens?.refreshToken) {
              const newTokens = await this.refreshToken(tokens.refreshToken);
              await this.storageService.saveTokens(newTokens);

              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await this.storageService.clearTokens();
            throw this.handleError(refreshError);
          }
        }

        throw this.handleError(error);
      }
    );
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message || 'Network error',
        statusCode: error.response?.status || 0,
        details: error.response?.data,
      };
    }
    return {
      message: error.message || 'Unknown error',
      statusCode: 0,
    };
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    return response.data;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default new ApiService();
