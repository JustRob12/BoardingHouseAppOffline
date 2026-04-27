import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Home,
  Clock,
  FileText
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TenantDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tenant = route.params?.tenant;

  const handleDelete = () => {
    Alert.alert(
      'Delete Tenant',
      'Are you sure you want to remove this tenant?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await AsyncStorage.getItem('tenants');
              if (data) {
                let tenants = JSON.parse(data);
                tenants = tenants.filter((t: any) => t.id !== tenant.id);
                await AsyncStorage.setItem('tenants', JSON.stringify(tenants));
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete tenant.');
            }
          }
        }
      ]
    );
  };

  const infoItems = [
    { label: 'Age', value: `${tenant.age} Years Old`, icon: User },
    { label: 'Birthday', value: tenant.birthday, icon: Calendar },
    { label: 'Start Date', value: tenant.startDate || 'N/A', icon: Calendar },
    { label: 'Phone', value: tenant.phone, icon: Phone },
    { label: 'Email', value: tenant.email || 'N/A', icon: Mail },
    { label: 'Assigned Room', value: tenant.roomTitle || 'Unassigned', icon: Home },
    { label: 'Registered On', value: new Date(tenant.createdAt).toLocaleDateString(), icon: Clock },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Details</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddTenant', { tenant })}
          style={styles.editButton}
        >
          <Edit3 color={Colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            {tenant.image ? (
              <Image source={{ uri: tenant.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <User color={Colors.secondary} size={60} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{tenant.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active Tenant</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {infoItems.map((item, index) => (
            <View key={index} style={styles.infoCard}>
              <View style={styles.iconContainer}>
                <item.icon color={Colors.primary} size={18} />
              </View>
              <View>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.recordButton} 
          onPress={() => navigation.navigate('TenantRecord', { tenant })}
        >
          <FileText color={Colors.primary} size={20} />
          <Text style={styles.recordButtonText}>View Payment Records</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 color="#FF4D4F" size={20} />
          <Text style={styles.deleteButtonText}>Remove Tenant</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  editButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#E6F7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#91D5FF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoGrid: {
    padding: 20,
    gap: 15,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4F',
    backgroundColor: '#FFF1F0',
    gap: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4D4F',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#F0F5FF',
    gap: 10,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default TenantDetailScreen;
