/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount, OnlineRoom, OnlineMatchRecord } from '../types/multiplayer';

class ApiService {
  private token: string | null = null;

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('penfight_auth_token', token);
    } else {
      localStorage.removeItem('penfight_auth_token');
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('penfight_auth_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  public async initGuest(existingId?: string): Promise<{ user: UserAccount; token: string }> {
    const res = await this.request<{ user: UserAccount; token: string }>('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ existingId }),
    });
    this.setToken(res.token);
    return res;
  }

  public async register(
    username: string,
    displayName: string,
    avatarId: string,
    password?: string
  ): Promise<{ user: UserAccount; token: string }> {
    const res = await this.request<{ user: UserAccount; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, displayName, avatarId, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async login(username: string, password?: string): Promise<{ user: UserAccount; token: string }> {
    const res = await this.request<{ user: UserAccount; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async upgradeGuest(
    newUsername: string,
    newDisplayName: string,
    password?: string
  ): Promise<{ user: UserAccount }> {
    return this.request<{ user: UserAccount }>('/api/auth/upgrade', {
      method: 'POST',
      body: JSON.stringify({ newUsername, newDisplayName, password }),
    });
  }

  public async updateProfile(
    displayName?: string,
    avatarId?: string,
    favoritePenId?: string
  ): Promise<{ user: UserAccount }> {
    return this.request<{ user: UserAccount }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ displayName, avatarId, favoritePenId }),
    });
  }

  public async searchUsers(query: string): Promise<{ users: UserAccount[] }> {
    return this.request<{ users: UserAccount[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  public async getUserProfile(id: string): Promise<{ user: UserAccount }> {
    return this.request<{ user: UserAccount }>(`/api/users/${encodeURIComponent(id)}`);
  }

  public async getPublicRooms(type?: 'duel-1v1' | 'ffa-3p'): Promise<{ rooms: OnlineRoom[] }> {
    const query = type ? `?type=${type}` : '';
    return this.request<{ rooms: OnlineRoom[] }>(`/api/rooms${query}`);
  }

  public async getMatchHistory(userId?: string): Promise<{ records: OnlineMatchRecord[] }> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request<{ records: OnlineMatchRecord[] }>(`/api/history${query}`);
  }

  public async getLeaderboard(mode: '1v1' | '3p' = '1v1'): Promise<{
    leaderboard: Array<{
      rank: number;
      id: string;
      username: string;
      displayName: string;
      avatarId: string;
      rating: number;
      tier: string;
      wins: number;
      matches: number;
      favoritePenId: string;
    }>;
  }> {
    return this.request(`/api/leaderboard?mode=${mode}`);
  }

  public async reportPlayer(targetId: string, reason: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/report', {
      method: 'POST',
      body: JSON.stringify({ targetId, reason }),
    });
  }

  public async blockPlayer(targetId: string, block: boolean): Promise<{ blockedUsers: string[] }> {
    return this.request<{ blockedUsers: string[] }>('/api/block', {
      method: 'POST',
      body: JSON.stringify({ targetId, block }),
    });
  }
}

export const api = new ApiService();
