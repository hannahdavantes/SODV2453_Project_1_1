import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import * as api from './api';

export const EVENTS_CACHE_KEY = 'volunteem_events';

export const isNetworkAvailable = async (): Promise<boolean> => {
    try {
        const { isConnected, isInternetReachable } = await Network.getNetworkStateAsync();
        return !!isConnected && isInternetReachable !== false;
    } catch (e) {
        return false;
    }
};

// Fetches events from the API when a network is available and caches the result
// Falls back to the cached events when offline or when the request fails
export const getEventsFromNetworkOrCache = async (): Promise<any[]> => {
    if (await isNetworkAvailable()) {
        try {
            const response = await api.getEvents();
            await setInCache(EVENTS_CACHE_KEY, response.data);
            return response.data;
        } catch (e) {
            console.log('Failed to fetch events from the API, loading from cache.', e);
        }
    }
    return getFromCache<any[]>(EVENTS_CACHE_KEY);
};

export const setInCache = (key: string, value: any) => {
    const jsonValue = JSON.stringify(value);
    return AsyncStorage.setItem(key, jsonValue);
};

export const getFromCache = async <T>(key: string): Promise<T> => {
    const json = await AsyncStorage.getItem(key);
    return await (json != null ? Promise.resolve(JSON.parse(json)) : Promise.reject(`Key "${key}" not in cache`));
};
