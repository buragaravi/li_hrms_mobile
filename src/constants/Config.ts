import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Use the local IP address for physical device testing, or localhost for simulator
// Replace with your machine's IP (e.g., '192.168.1.5') to test on a real phone
const LOCALHOST = Platform.OS === 'android' ? '192.168.0.36' : 'localhost';

export const API_BASE_URL = `http://${LOCALHOST}:5000/api`;

export const CONFIG = {
    API_BASE_URL,
    APP_NAME: 'LI HRMS',
    APP_VERSION: Constants.expoConfig?.version || '1.0.0',
};
