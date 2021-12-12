import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export type AuthenticatedRoute = {
  authorization: string;
};
export type Field = {
  name: string;
  message: string;
};
export type Error = {
  message: string;
  fields: Field[];
};
export enum FeedType {
  Video = 'Video',
  Photo = 'Photo',
  Post = 'Post',
}
export type Video = {
  id: string;
  videoUrl: string;
  type: 'Video';
};
export type Photo = {
  id: string;
  photoUrl: string;
  type: 'Photo';
};
export type Post = {
  id: string;
  postBody: string;
  type: 'Post';
};
export type Feed = Video | Photo | Post;
export enum UserType {
  admin = 'admin',
  user = 'user',
}
export type User = {
  id: number;
  username: string;
  age: number;
  type: UserType;
  isCool: boolean;
  createdAt: string;
};

const createHTTPClient = (config?: AxiosRequestConfig) => {
  const axios = Axios.create(config);

  return {
    async login(req: {
      body: {
        username: string;
        password: string;
      };
    }): Promise<
      AxiosResponse<{
        token: string;
      }>
    > {
      return axios.request({
        method: 'POST',
        url: `/login`,

        data: req.body,
      });
    },

    async logout(): Promise<AxiosResponse<undefined>> {
      return axios.request({
        method: 'POST',
        url: `/logout`,

        data: {},
      });
    },

    async health(): Promise<
      AxiosResponse<{
        ok: 'ok';
      }>
    > {
      return axios.request({
        method: 'GET',
        url: `/health`,

        data: {},
      });
    },

    async getFeed(): Promise<AxiosResponse<Feed[]>> {
      return axios.request({
        method: 'GET',
        url: `/feed`,

        data: {},
      });
    },

    async getUsers(req: {
      query?: {
        q?: string;
      };
      headers: AuthenticatedRoute;
    }): Promise<AxiosResponse<User[]>> {
      return axios.request({
        method: 'GET',
        url: `/users`,
        params: req.query,
        headers: req.headers,
        data: {},
      });
    },

    async getUser(id: number): Promise<AxiosResponse<User>> {
      return axios.request({
        method: 'GET',
        url: `/users/${id}`,

        data: {},
      });
    },

    async postUser(req: {
      body: {
        username: string;
        age: number;
        type: UserType;
        isCool: boolean;
      };
      headers: AuthenticatedRoute;
    }): Promise<AxiosResponse<User>> {
      return axios.request({
        method: 'POST',
        url: `/users`,

        headers: req.headers,
        data: req.body,
      });
    },

    async updateUser(
      id: number,
      req: {
        body?: {
          username?: string;
          age?: number;
          isCool?: boolean;
          createdAt?: string;
        };
        headers: AuthenticatedRoute;
      },
    ): Promise<AxiosResponse<User>> {
      return axios.request({
        method: 'PATCH',
        url: `/users/${id}`,

        headers: req.headers,
        data: req.body,
      });
    },
  };
};

export default createHTTPClient;
