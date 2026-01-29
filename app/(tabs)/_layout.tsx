import { Tabs } from 'expo-router';
import { LayoutDashboard, Clock, Calendar, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#10B981',
                tabBarInactiveTintColor: '#CBD5E1',
                tabBarLabelStyle: {
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
                    fontWeight: '900',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: -5
                },
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    elevation: 10,
                    height: 100,
                    paddingBottom: 35,
                    paddingTop: 15,
                    borderTopLeftRadius: 40,
                    borderTopRightRadius: 40,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: -10 },
                    shadowOpacity: 0.08,
                    shadowRadius: 20,
                    borderWidth: 2,
                    borderColor: '#F1F5F9'
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, size }) => (
                        <Clock size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaves"
                options={{
                    title: 'Leaves',
                    tabBarIcon: ({ color, size }) => (
                        <Calendar size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <User size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
