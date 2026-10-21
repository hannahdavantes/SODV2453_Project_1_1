import axios, { AxiosResponse } from 'axios';
import { getEnvironentVariable } from '../utils';

// You can use any hosting service of your preference.
// In this case, we will use the freeimage.host API: https://freeimage.host/page/api.
//
// Sign up for free at https://freeimage.host/signup
// Get your API key and add it to the .env file in your root folder:
// FREEIMAGE_API_KEY=insert_your_api_key_here
//
// Expo loads the .env file when the app starts, and app.config.ts exposes the key
// through 'extra'.
//
// When creating your app build or publishing, do not forget to run 'eas secret:push' command
// to import your secret values to EAS.

export type UploadedImage = {
    url: string;
    filename: string;
    size: number; // bytes
    thumb: { url: string };
};

type UploadResponse = {
    image: UploadedImage;
};

const imageApi = axios.create({
    baseURL: 'https://freeimage.host/api/1',
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { key: getEnvironentVariable('FREEIMAGE_API_KEY'), action: 'upload', format: 'json' },
});

export const uploadImage = (imageBase64: string): Promise<AxiosResponse<UploadResponse>> => {
    const data = new FormData();
    data.append('source', imageBase64);

    return imageApi.post('/upload', data);
};
