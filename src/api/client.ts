import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../constants/Config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding the bearer token
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized across the app
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export interface AttendanceRecord {
    _id: string;
    employeeNumber: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'OFF';
    inTime?: string;
    outTime?: string;
    lateMins?: number;
    earlyOutMins?: number;
    otHours?: number;
    totalHours?: string;
    shiftId?: {
        name: string;
        startTime: string;
        endTime: string;
    };
}

export interface AttendanceDetail extends AttendanceRecord {
    rawLogs?: Array<{
        time: string;
        type: 'IN' | 'OUT';
        device?: string;
    }>;
}

export interface LeaveRequest {
    _id: string;
    employeeId: any;
    leaveType: string;
    startDate?: string; // keeping for backward compat if needed, but prefer fromDate
    endDate?: string;
    fromDate: string;
    toDate: string;
    days?: number;
    numberOfDays: number;
    reason?: string;
    purpose: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    appliedDate: string;
    approvedBy?: any;
    remarks?: string;
    isHalfDay?: boolean;
    halfDayType?: 'first_half' | 'second_half';
    contactNumber?: string;
}

export interface ODRequest {
    _id: string;
    employeeId: any;
    date: string;
    placeVisited: string;
    purpose: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    appliedDate: string;
    outcome?: string;
    odType?: string;
    odType_extended?: 'full_day' | 'half_day' | 'hours';
    odStartTime?: string;
    odEndTime?: string;
    photoEvidence?: {
        url: string;
        key: string;
        exifLocation?: { lat: number; lng: number };
    };
}

export interface CCLRequest {
    _id: string;
    employeeId: any;
    date: string;
    holidayName?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    appliedDate: string;
    assignedBy?: any; // was verifiedBy
    isHalfDay?: boolean;
    halfDayType?: 'first_half' | 'second_half';
    purpose?: string;
}

export const api = {
    // Auth
    login: (data: any) => apiClient.post('/auth/login', data),
    getMe: () => apiClient.get('/auth/me'),

    // User / Profile
    updateProfile: (data: any) => apiClient.put('/users/profile', data),

    // Employees
    getEmployee: (empNo: string) => apiClient.get(`/employees/${empNo}`),

    // Attendance
    getAttendanceDetail: (employeeNumber: string, date: string) =>
        apiClient.get<AttendanceDetail>('/attendance/detail', { params: { employeeNumber, date } }),

    getAttendanceList: (params: {
        employeeNumber: string;
        startDate: string;
        endDate: string;
        page?: number;
        limit?: number;
    }) => apiClient.get<{ docs: AttendanceRecord[]; totalDocs: number; limit: number; page: number; totalPages: number }>(
        '/attendance/list',
        { params }
    ),

    // Leaves
    getMyLeaves: () => apiClient.get<LeaveRequest[]>('/leaves/my'),
    getPendingApprovals: () => apiClient.get<LeaveRequest[]>('/leaves/pending-approvals'),
    getAllLeaves: (params?: any) => apiClient.get<LeaveRequest[]>('/leaves', { params }),
    applyLeave: (data: Partial<LeaveRequest>) => apiClient.post('/leaves', data),
    takeLeaveAction: (id: string, action: 'APPROVED' | 'REJECTED', remarks?: string) =>
        apiClient.put(`/leaves/${id}/action`, { action, remarks }),
    getApprovedRecordsForDate: (employeeId: string, date: string) =>
        apiClient.get<{ hasLeave: boolean; hasOD: boolean; leaveInfo?: any; odInfo?: any }>('/leaves/approved-records', { params: { employeeId, date } }),
    getLeaveSettings: (type: 'leave' | 'od') => apiClient.get<{ types: Array<{ name: string; code: string; isActive: boolean }> }>(`/leaves/settings/${type}`),

    // OD (On Duty)
    getMyODs: () => apiClient.get<ODRequest[]>('/leaves/od/my'),
    applyOD: (data: Partial<ODRequest>) => apiClient.post('/leaves/od', data),
    updateODOutcome: (id: string, outcome: string) => apiClient.put(`/leaves/od/${id}/outcome`, { outcome }),
    cancelOD: (id: string) => apiClient.put(`/leaves/od/${id}/cancel`),

    // CCL (Compensatory Casual Leave)
    validateCCLDate: (date: string) => apiClient.get('/leaves/ccl/validate-date', { params: { date } }),
    applyCCL: (data: Partial<CCLRequest>) => apiClient.post('/leaves/ccl', data),
    getCCLVerifiers: () => apiClient.get('/leaves/ccl/assigned-by-users'),
    getHolidays: () => apiClient.get('/leaves/holidays'),
    getMyCCLRequests: () => apiClient.get<CCLRequest[]>('/leaves/ccl/my'),

    // Stats
    getLeaveStats: () => apiClient.get('/leaves/stats'),
};

export default apiClient;
