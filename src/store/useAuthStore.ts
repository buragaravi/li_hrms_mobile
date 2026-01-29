import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    emp_no?: string;
    employeeRef?: string;
    department?: { _id: string; name: string };
    division?: { _id: string; name: string };
    isActive?: boolean;
    is_active?: boolean;
}

export interface Employee {
    _id: string;
    emp_no: string;
    employee_name: string;
    joining_date?: string;
    designation?: { name: string };
    department?: { name: string };
    division?: { name: string };
    reporting_manager?: { employee_name: string };
    shiftId?: { name: string; startTime: string; endTime: string };
    employment_status?: string;
    blood_group?: string;
    personal_email?: string;
    address?: string;
}

interface AuthState {
    user: User | null;
    employee: Employee | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    setEmployee: (employee: Employee | null) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            employee: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
            setEmployee: (employee) => set({ employee }),
            logout: () => set({ user: null, employee: null, token: null, isAuthenticated: false }),
            updateUser: (updatedUser) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updatedUser } : null
                })),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
