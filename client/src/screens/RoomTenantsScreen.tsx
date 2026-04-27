import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Platform,
  Modal,
  Alert,
  Clipboard
} from 'react-native';
import { ArrowLeft, User, Phone, Mail, Home, MoreVertical, Eye, FileText } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoClipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const RoomTenantsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { roomId, roomTitle } = route.params;

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadTenants = async () => {
    try {
      const data = await AsyncStorage.getItem('tenants');
      if (data) {
        const allTenants = JSON.parse(data);
        const filtered = allTenants.filter((t: any) => t.roomId === roomId);
        setTenants(filtered);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTenants();
    }, [roomId])
  );

  const handleCopy = async (text: string, label: string) => {
    await ExpoClipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} has been copied to clipboard.`);
    setModalVisible(false);
  };

  const openModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setModalVisible(true);
  };

  const renderTenantCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.tenantCard} onPress={() => openModal(item)}>
      <View style={styles.cardHeader}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User color={Colors.secondary} size={24} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.tenantName}>{item.name}</Text>
          <Text style={styles.tenantAge}>{item.age} Years Old • {item.birthday}</Text>
        </View>
        <MoreVertical color={Colors.secondary} size={20} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.contactItem}>
          <Phone color={Colors.primary} size={14} />
          <Text style={styles.contactText}>{item.phone}</Text>
        </View>
        <View style={styles.contactItem}>
          <Mail color={Colors.primary} size={14} />
          <Text style={styles.contactText} numberOfLines={1}>{item.email || 'No email'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Tenants</Text>
          <View style={styles.roomBadge}>
            <Home color={Colors.primary} size={12} />
            <Text style={styles.roomBadgeText}>{roomTitle}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={tenants}
        keyExtractor={(item) => item.id}
        renderItem={renderTenantCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User color={Colors.border} size={60} />
            <Text style={styles.emptyText}>No tenants assigned to this room.</Text>
          </View>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTenant?.name}</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('TenantDetail', { tenant: selectedTenant });
              }}
            >
              <Eye color={Colors.primary} size={20} />
              <Text style={styles.modalOptionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('TenantRecord', { tenant: selectedTenant });
              }}
            >
              <FileText color={Colors.primary} size={20} />
              <Text style={styles.modalOptionText}>View Record</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => handleCopy(selectedTenant?.phone, 'Phone number')}
            >
              <Phone color={Colors.primary} size={20} />
              <Text style={styles.modalOptionText}>Call (Copy Number)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => handleCopy(selectedTenant?.email, 'Email address')}
            >
              <Mail color={Colors.primary} size={20} />
              <Text style={styles.modalOptionText}>Message (Copy Email)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setModalVisible(false)}
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
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    gap: 4,
  },
  roomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    padding: 15,
    paddingBottom: 40,
  },
  tenantCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  tenantAge: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contactText: {
    fontSize: 13,
    color: Colors.text,
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

export default RoomTenantsScreen;
