import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { User, Settings, Moon, ChevronDown, Bell, Sun } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const closeMenu = () => setMenuVisible(false);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const getTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Intl.DateTimeFormat('en-US', options).format(new Date());
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
      <View style={styles.container}>
        {/* Left Side: App Title & Date */}
        <View style={styles.leftSection}>
          <Text style={[styles.logoText, { color: colors.primary }]}>BHouse</Text>
          <Text style={[styles.dateText, { color: colors.secondary }]}>{getTodayDate()}</Text>
        </View>

        {/* Right Side: Notification & Profile */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell color={colors.secondary} size={22} />
            <View style={[styles.badge, { borderColor: colors.white }]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: isDarkMode ? colors.border : '#F0F2F5' }]} 
            onPress={toggleMenu}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarContainer, { backgroundColor: colors.white }]}>
              <User color={colors.primary} size={18} />
            </View>
            <ChevronDown color={colors.secondary} size={14} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu (Absolute Positioned) */}
        {menuVisible && (
          <>
            <TouchableWithoutFeedback onPress={closeMenu}>
              <View style={styles.overlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.dropdownMenu, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.menuItem} onPress={closeMenu}>
                <Settings color={colors.secondary} size={18} />
                <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <TouchableOpacity style={styles.menuItem} onPress={handleToggleTheme}>
                {isDarkMode ? (
                  <Sun color={colors.accent} size={18} />
                ) : (
                  <Moon color={colors.secondary} size={18} />
                )}
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 1000,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 30 : 0,
    zIndex: 1000,
  },
  leftSection: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 15,
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 4,
    borderRadius: 20,
    paddingRight: 8,
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  overlay: {
    position: 'absolute',
    top: -500, // Cover everything
    left: -500,
    right: -500,
    bottom: -1000,
    zIndex: 998,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 6,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 999,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 15,
    color: Colors.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  }
});

export default Header;
