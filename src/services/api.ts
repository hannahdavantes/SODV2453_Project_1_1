import axios, { AxiosResponse } from 'axios';
import { Event } from '../types/Event';

const api = axios.create({
    // Before running your 'json-server', get your computer's IP address and
    // update your baseURL to `http://your_ip_address_here:3333` and then run:
    // `npx json-server --watch db.json --port 3333 --host your_ip_address_here`
    //
    // To access your server online without running json-server locally,
    // you can set your baseURL to:
    // `https://my-json-server.typicode.com/<your-github-username>/<your-github-repo>`
    //
    // To use `my-json-server`, make sure your `db.json` is located at the repo root.

    // baseURL: 'http://0.0.0.0:3333',
    baseURL: 'http://192.168.1.96:3333',
});

export const authenticateUser = (email: string, password: string): Promise<AxiosResponse> => {
    return api.post(`/login`, { email, password });
};

export const getEvents = (): Promise<AxiosResponse> => {
    return api.get(`/events`);
};

export const createEvent = (event: Event): Promise<AxiosResponse> => {
    return api.post(`/events`, event);
};

export const getUser =(id: string): Promise<AxiosResponse> => {
    return api.get(`/users/${id}`);
};
