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
import { useTheme } from '../context/ThemeContext';

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

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors } = useTheme();
  
  const renderTabButton = (route: any, index: number) => {
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const Icon = () => {
      const color = isFocused ? colors.primary : colors.secondary;
      const size = 22;
      switch (route.name) {
        case 'Home': return <LayoutDashboard color={color} size={size} />;
        case 'Rooms': return <DoorOpen color={color} size={size} />;
        case 'Tenants': return <Users color={color} size={size} />;
        case 'Bills': return <BookOpen color={color} size={size} />;
        case 'System': return <Settings color={color} size={size} />;
        default: return null;
      }
    };

    return (
      <TouchableOpacity
        key={route.name}
        onPress={onPress}
        style={styles.tabButton}
      >
        <Icon />
        <Text style={[styles.tabLabelBottom, { color: isFocused ? colors.primary : colors.secondary }]}>
          {route.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* Left Container: Main Navigation Group */}
      <View style={[styles.leftGroupContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
        {state.routes.map((route: any, index: number) => {
          if (route.name === 'Tenants') return null;
          return renderTabButton(route, index);
        })}
      </View>

      {/* Right Container: Tenants Only */}
      <View style={[styles.rightSoloContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
        {state.routes.map((route: any, index: number) => {
          if (route.name !== 'Tenants') return null;
          return renderTabButton(route, index);
        })}
      </View>
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: () => <Header />,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Rooms" component={RoomsScreen} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="Bills" component={LedgerScreen} />
      <Tab.Screen name="System" component={SystemScreen} />
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
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  leftGroupContainer: {
    flex: 1,
    marginRight: 12,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
  },
  rightSoloContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabLabelBottom: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
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
