import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { ArrowLeft, Home, Layers, Users as UsersIcon, CreditCard, Edit2, Trash2, CheckCircle2, User } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';

const RoomDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { room: initialRoom } = route.params;
  const [room, setRoom] = useState(initialRoom);
  const [tenants, setTenants] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const tenantsData = await AsyncStorage.getItem('tenants');
      if (tenantsData) {
        const allTenants = JSON.parse(tenantsData);
        const roomTenants = allTenants.filter((t: any) => t.roomId === room.id);
        setTenants(roomTenants);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to remove this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await AsyncStorage.getItem('rooms');
              if (data) {
                const rawRooms = JSON.parse(data);
                const updated = rawRooms.filter((r: any) => r.id !== room.id);
                await AsyncStorage.setItem('rooms', JSON.stringify(updated));
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete room.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Room Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddRoom', { room })}
          style={styles.editHeaderBtn}
        >
          <Edit2 color={Colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.roomTitle}>{room.title}</Text>
          <View style={styles.floorBadge}>
            <Home color={Colors.white} size={14} />
            <Text style={styles.floorBadgeText}>{room.roomType}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <UsersIcon color={Colors.primary} size={24} />
            <Text style={styles.statValue}>{room.capacity}</Text>
            <Text style={styles.statLabel}>Capacity</Text>
          </View>

          <View style={styles.statCard}>
            <CreditCard color={Colors.primary} size={24} />
            <Text style={styles.statValue}>₱{room.amount}</Text>
            <Text style={styles.statLabel}>Monthly Rent</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Room Information</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            {room.status === 'Maintenance' ? (
              <View style={[styles.statusBadge, { backgroundColor: '#FFF3CD' }]}>
                <View style={[styles.statusDot, { backgroundColor: '#FFC107' }]} />
                <Text style={[styles.statusText, { color: '#856404' }]}>Maintenance</Text>
              </View>
            ) : tenants.length >= parseInt(room.capacity) ? (
              <View style={[styles.statusBadge, { backgroundColor: '#FFF1F0' }]}>
                <View style={[styles.statusDot, { backgroundColor: '#FF4D4F' }]} />
                <Text style={[styles.statusText, { color: '#FF4D4F' }]}>Fully Occupied</Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Available ({parseInt(room.capacity) - tenants.length} left)</Text>
              </View>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Room Type</Text>
            <Text style={styles.infoValue}>{room.roomType}</Text>
          </View>
        </View>

        {room.incentives?.length > 0 && (
          <View style={styles.incentiveSection}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.incentiveList}>
              {room.incentives.map((inc: string) => (
                <View key={inc} style={styles.incentiveItem}>
                  <CheckCircle2 color={Colors.primary} size={20} />
                  <Text style={styles.incentiveText}>{inc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.maintenanceSection}>
          <TouchableOpacity 
            style={[
              styles.maintenanceButton, 
              room.status === 'Maintenance' && styles.maintenanceButtonActive
            ]}
            onPress={async () => {
              try {
                const newStatus = room.status === 'Maintenance' ? 'Active' : 'Maintenance';
                const roomsData = await AsyncStorage.getItem('rooms');
                if (roomsData) {
                  const allRooms = JSON.parse(roomsData);
                  const updated = allRooms.map((r: any) => 
                    r.id === room.id ? { ...r, status: newStatus } : r
                  );
                  await AsyncStorage.setItem('rooms', JSON.stringify(updated));
                  setRoom({ ...room, status: newStatus });
                  Alert.alert('Success', `Room is now ${newStatus}`);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to update room status.');
              }
            }}
          >
            <Layers color={room.status === 'Maintenance' ? Colors.white : '#856404'} size={20} />
            <Text style={[
              styles.maintenanceButtonText,
              room.status === 'Maintenance' && { color: Colors.white }
            ]}>
              {room.status === 'Maintenance' ? 'Set as Active' : 'Set as Maintenance'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Action Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Trash2 color="#FF4D4F" size={20} />
          <Text style={styles.deleteButtonText}>Delete Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  editHeaderBtn: {
    padding: 8,
    marginRight: -8,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  roomTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  floorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  floorBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38B2AC',
  },
  statusText: {
    fontSize: 12,
    color: '#38B2AC',
    fontWeight: '700',
  },
  incentiveSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 100,
  },
  incentiveList: {
    gap: 15,
  },
  incentiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incentiveText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  maintenanceSection: {
    paddingHorizontal: 20,
    marginBottom: 120,
  },
  maintenanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEEBA',
    backgroundColor: '#FFF3CD',
    gap: 8,
  },
  maintenanceButtonActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  maintenanceButtonText: {
    color: '#856404',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEBEB',
    backgroundColor: '#FFF8F8',
    gap: 8,
  },
  deleteButtonText: {
    color: '#FF4D4F',
    fontSize: 16,
    fontWeight: '700',
  }
});

export default RoomDetailScreen;
