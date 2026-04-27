import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationState } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  BookOpen,
  Settings
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';

import DashboardScreen from '../screens/DashboardScreen';
import RoomsScreen from '../screens/RoomsScreen';
import TenantsScreen from '../screens/TenantsScreen';
import LedgerScreen from '../screens/LedgerScreen';
import SystemScreen from '../screens/SystemScreen';
import Header from '../components/Header';

import { createStackNavigator } from '@react-navigation/stack';
import AddRoomScreen from '../screens/AddRoomScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import AddTenantScreen from '../screens/AddTenantScreen';
import TenantDetailScreen from '../screens/TenantDetailScreen';
import RoomTenantsScreen from '../screens/RoomTenantsScreen';
import TenantRecordScreen from '../screens/TenantRecordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomTabButton = ({ onPress, label }: any) => {
  const state = useNavigationState(state => state);
  const activeIndex = state?.index;
  const activeRouteName = state?.routeNames[activeIndex];
  const selected = activeRouteName === 'Tenants';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        ...styles.shadow
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: selected ? Colors.primary : Colors.white,
          borderWidth: selected ? 0 : 2,
          borderColor: Colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 5
        }}
      >
        <Users color={selected ? Colors.white : Colors.primary} size={24} />
        <Text
          style={{
            color: selected ? Colors.white : Colors.primary,
            fontSize: 10,
            fontWeight: 'bold',
            marginTop: 2
          }}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <Header />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          ...styles.shadow
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <DoorOpen color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tenants"
        component={TenantsScreen}
        options={{
          tabBarButton: (props) => (
            <CustomTabButton {...props} label="Tenants" />
          ),
        }}
      />
      <Tab.Screen
        name="Bills"
        component={LedgerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="System"
        component={SystemScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen
        name="AddRoom"
        component={AddRoomScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen
        name="AddTenant"
        component={AddTenantScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="TenantDetail" component={TenantDetailScreen} />
      <Stack.Screen name="RoomTenants" component={RoomTenantsScreen} />
      <Stack.Screen name="TenantRecord" component={TenantRecordScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5
  }
});

export default AppNavigator;
