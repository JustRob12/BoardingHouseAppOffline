import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SectionList, 
  Alert,
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { Home, Plus, Eye, Users, User } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 50) / 2;

const RoomsScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<any>();
  const [sections, setSections] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);

  const loadRooms = async () => {
    try {
      const roomsData = await AsyncStorage.getItem('rooms');
      const tenantsData = await AsyncStorage.getItem('tenants');
      
      if (roomsData) {
        const rawRooms = JSON.parse(roomsData);
        const tenants = tenantsData ? JSON.parse(tenantsData) : [];
        
        // Calculate occupancy and collect tenants
        const roomsWithOccupancy = rawRooms.map((room: any) => {
          const roomTenants = tenants.filter((t: any) => t.roomId === room.id);
          const occupiedCount = roomTenants.length;
          const remainingPax = Math.max(0, parseInt(room.capacity) - occupiedCount);
          return { ...room, occupiedCount, remainingPax, tenants: roomTenants };
        });

        setAllRooms(roomsWithOccupancy);
        applyFilters(roomsWithOccupancy, activeFilter);
      } else {
        setSections([]);
        setAllRooms([]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const applyFilters = (rooms: any[], filter: string) => {
    let filtered = [...rooms];
    if (filter === 'Vacant') {
      filtered = rooms.filter(r => r.remainingPax > 0 && r.status !== 'Maintenance');
    } else if (filter === 'Occupied') {
      filtered = rooms.filter(r => r.remainingPax === 0 && r.status !== 'Maintenance');
    } else if (filter === 'Maintenance') {
      filtered = rooms.filter(r => r.status === 'Maintenance');
    }

    const groups: { [key: string]: any[] } = {};
    filtered.forEach((room: any) => {
      const type = room.roomType || 'Bed spacer';
      if (!groups[type]) groups[type] = [];
      groups[type].push(room);
    });

    const sectionData = Object.keys(groups)
      .sort()
      .map(type => {
        const typeRooms = groups[type];
        const chunkedRooms = [];
        for (let i = 0; i < typeRooms.length; i += 2) {
          chunkedRooms.push(typeRooms.slice(i, i + 2));
        }
        return { title: type, data: chunkedRooms };
      });

    setSections(sectionData);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    applyFilters(allRooms, filter);
  };

  const handleRoomPress = (room: any) => {
    setSelectedRoom(room);
    setChoiceModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [])
  );

  const renderRoomCard = (room: any) => {
    const isFull = room.remainingPax === 0 && room.status !== 'Maintenance';
    const isMaintenance = room.status === 'Maintenance';
    
    return (
      <TouchableOpacity 
        key={room.id}
        style={[
          styles.roomCard, 
          { backgroundColor: colors.card, borderColor: colors.border },
          isFull && styles.roomCardFull,
          isMaintenance && styles.roomCardMaintenance
        ]}
        onPress={() => handleRoomPress(room)}
      >
        <View style={styles.cardContent}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.roomTitle, { color: colors.text }, (isFull || isMaintenance) && styles.whiteText]} numberOfLines={1}>
              {room.title}
            </Text>
            <Text style={[styles.cardPrice, { color: colors.primary }, (isFull || isMaintenance) && styles.whiteText]}>
              ₱{room.amount}
            </Text>
            {room.tenants && room.tenants.length > 0 ? (
              <View style={styles.miniAvatarsRow}>
                {room.tenants.slice(0, 3).map((tenant: any) => (
                  <View key={tenant.id} style={[styles.miniAvatarContainer, { backgroundColor: isDarkMode ? colors.border : '#F0F2F5', borderColor: isFull || isMaintenance ? (isFull ? '#FF4D4F' : '#FFC107') : colors.card }]}>
                    {tenant.image ? (
                      <Image source={{ uri: tenant.image }} style={styles.miniAvatar} />
                    ) : (
                      <User color={colors.secondary} size={8} />
                    )}
                  </View>
                ))}
                {room.tenants.length > 3 && (
                  <Text style={[styles.moreTenants, (isFull || isMaintenance) && styles.whiteText, !(isFull || isMaintenance) && { color: colors.secondary }]}>
                    +{room.tenants.length - 3}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.noTenantText, isFull && styles.whiteText, isMaintenance && { color: '#856404' }, !(isFull || isMaintenance) && { color: colors.secondary }]}>
                No Tenant yet
              </Text>
            )}
          </View>
          <View style={styles.paxSideContainer}>
            <Text style={[styles.paxNumber, (isFull || isMaintenance) ? styles.whiteText : { color: colors.primary }]}>
              {isMaintenance ? '!' : room.remainingPax}
            </Text>
            <Text style={[styles.paxLabel, (isFull || isMaintenance) ? styles.whiteText : { color: colors.secondary }]}>
              {isMaintenance ? 'MNT' : 'PAX'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item }: { item: any[] }) => (
    <View style={styles.row}>
      {item.map((room) => renderRoomCard(room))}
      {item.length === 1 && <View style={{ width: COLUMN_WIDTH }} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerArea, { backgroundColor: colors.background }]}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>Rooms</Text>
        <View style={styles.filterContainer}>
          {['All', 'Vacant', 'Occupied', 'Maintenance'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip, 
                { backgroundColor: colors.card, borderColor: colors.border },
                activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handleFilterChange(f)}
            >
              <Text style={[styles.filterText, { color: colors.secondary }, activeFilter === f && { color: '#FFF' }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => (item[0]?.id || index).toString()}
        renderItem={renderRow}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Home color={colors.primary} size={14} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionHeaderText, { color: colors.primary }]}>
              {title}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Home color={colors.border} size={60} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No rooms added yet.</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddRoom')}
        activeOpacity={0.8}
      >
        <Plus color={Colors.white} size={30} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Room Action Choice Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={choiceModalVisible}
        onRequestClose={() => setChoiceModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setChoiceModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedRoom?.title}</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={() => {
                setChoiceModalVisible(false);
                navigation.navigate('RoomTenants', { 
                  roomId: selectedRoom.id, 
                  roomTitle: selectedRoom.title 
                });
              }}
            >
              <Users color={colors.primary} size={22} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>View Tenants</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={() => {
                setChoiceModalVisible(false);
                navigation.navigate('RoomDetail', { room: selectedRoom });
              }}
            >
              <Eye color={colors.primary} size={22} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>View Room Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setChoiceModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  headerArea: {
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    marginTop: 5,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roomCard: {
    backgroundColor: Colors.white,
    width: COLUMN_WIDTH,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roomCardFull: {
    backgroundColor: '#FF4D4F',
    borderColor: '#FF4D4F',
  },
  roomCardMaintenance: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  whiteText: {
    color: Colors.white,
  },
  paxSideContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  cardPriceRow: {
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '800',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paxSideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    minWidth: 40,
  },
  paxNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    lineHeight: 26,
  },
  paxLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  miniAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: -8, // Overlapping effect
  },
  miniAvatarContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F2F5',
    borderWidth: 1.5,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniAvatar: {
    width: '100%',
    height: '100%',
  },
  moreTenants: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.secondary,
    marginLeft: 12,
  },
  noTenantText: {
    fontSize: 9,
    color: Colors.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  closeModalButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  closeModalText: {
    fontSize: 16,
    color: '#FF4D4F',
    fontWeight: '700',
  },
});

export default RoomsScreen;
