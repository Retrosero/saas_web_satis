import { apiClient } from '@/lib/api-client';
import { LoginSchema, type LoginInput, type UserWithRoles } from '@saas/shared';

export const authApi = {
  async login(input: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserWithRoles;
  }> {
    // İstemci tarafı doğrulama (UI hızlı feedback için)
    LoginSchema.parse(input);
    const res = await apiClient.post<{
      data: { accessToken: string; refreshToken: string; user: UserWithRoles };
    }>('/auth/login', input);
    return res.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async me(): Promise<UserWithRoles> {
    const res = await apiClient.get<{ data: UserWithRoles }>('/auth/me');
    return res.data.data;
  },
};
