import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform, 
  Animated, 
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal
} from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  X,
  Home,
  Bookmark,
  Settings,
  Mail,
  Play
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import SearchBar from './SearchBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.65, 280);

export interface HeaderRef {
  handleScroll: (scrollY: number) => void;
}

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  onMenuPress?: () => void;
  isSearchBarVisible?: boolean;
  onSearchToggle?: (visible: boolean) => void;
}

const Header = forwardRef<HeaderRef, HeaderProps>(({ 
  title, 
  showSearch = true, 
  onMenuPress, 
  isSearchBarVisible: propIsSearchBarVisible = false, 
  onSearchToggle 
}, ref) => {
  const pathname = usePathname();
  const router = useRouter();
  const [internalIsSearchBarVisible, setInternalIsSearchBarVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const isSearchBarVisible = onSearchToggle ? propIsSearchBarVisible : internalIsSearchBarVisible;

  useImperativeHandle(ref, () => ({
    handleScroll: (value: number) => {
      scrollY.setValue(value);
    },
  }));

  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 30, 80],
    outputRange: [
      'rgba(10,10,20,0)',
      'rgba(10,10,20,0.2)',
      'rgba(10,10,20,0.4)'
    ],
    extrapolate: 'clamp',
  });

  const blurIntensity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 30],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 0.9],
    extrapolate: 'clamp',
  });

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  type RoutePath = '/(tabs)' | '/search' | '/(tabs)/explore' | '/(tabs)/watchlist' | '/(tabs)/profile';
  
  interface MenuItem {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    route: RoutePath;
  }

  const menuItems: MenuItem[] = [
    { icon: Home, label: 'Home', route: '/(tabs)' },
    { icon: Search, label: 'Search', route: '/search' },
    { icon: Play, label: 'Explore', route: '/(tabs)/explore' },
    { icon: Bookmark, label: 'Watchlist', route: '/(tabs)/watchlist' },
    { icon: Settings, label: 'Profile', route: '/(tabs)/profile' },
  ];

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.container, { backgroundColor: headerBackgroundColor }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
            {Platform.OS === 'ios' ? (
              <Animated.View style={StyleSheet.absoluteFill}>
                <BlurView 
                  tint="dark" 
                  intensity={blurIntensity as unknown as number}
                  style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
                />
              </Animated.View>
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark.background + 'F0' }]} />
            )}
          </Animated.View>

          <View style={styles.content}>
            <View style={styles.leftSection}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={toggleMenu}
                activeOpacity={0.7}
              >
                <Menu size={24} color={Colors.dark.text} />
              </TouchableOpacity>
              <Link href="/" asChild>
                <TouchableOpacity style={styles.logoContainer} activeOpacity={0.8}>
                  <Image
                    source={require('@/assets/images/arise.png')}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              </Link>
              {title && <Text style={styles.title}>{title}</Text>}
            </View>
            <View style={styles.rightSection}>
              {showSearch && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    if (onSearchToggle) {
                      onSearchToggle(!isSearchBarVisible);
                    } else {
                      setInternalIsSearchBarVisible(!isSearchBarVisible);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Search size={24} color={Colors.dark.text} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Bell size={24} color={Colors.dark.text} />
              </TouchableOpacity>
              <Link href="/profile" asChild>
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                  <User size={24} color={Colors.dark.text} />
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Search Modal */}
      {isSearchBarVisible && (
        <View style={styles.searchModalContainer}>
          <TouchableOpacity 
            style={styles.searchModalBackdrop} 
            activeOpacity={1}
            onPress={() => onSearchToggle ? onSearchToggle(false) : setInternalIsSearchBarVisible(false)}
          >
            <BlurView 
              style={styles.searchModalBlur} 
              intensity={50}
              tint="dark"
            />
          </TouchableOpacity>
          <View style={styles.searchModalContent}>
            <SearchBar autoFocus />
          </View>
        </View>
      )}

      {/* Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <View style={styles.menuModalContainer}>
          <BlurView 
            style={styles.menuModalBlur}
            intensity={20}
            tint="dark"
          >
            <TouchableOpacity 
              style={styles.menuModalBackdrop}
              activeOpacity={1}
              onPress={toggleMenu}
            />
            <Animated.View style={[styles.menuContent]}>
              <View style={styles.menuHeader}>
                <Image
                  source={require('@/assets/images/arise.png')}
                  style={styles.menuLogo}
                  contentFit="contain"
                />
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={toggleMenu}
                >
                  <X size={24} color={Colors.dark.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.menuItems}>
                {menuItems.map((item, index) => {
                  const isActive = pathname === item.route;
                  const ItemIcon = item.icon;
                  
                  return (
                    <Link 
                      key={item.route} 
                      href={item.route as string}
                      asChild
                    >
                      <TouchableOpacity
                        style={[
                          styles.menuItem,
                          isActive && styles.menuItemActive
                        ]}
                        onPress={() => {
                          toggleMenu();
                          router.push(item.route);
                        }}
                      >
                        <View style={styles.menuIconContainer}>
                          <ItemIcon 
                            size={20} 
                            color={isActive ? Colors.dark.primary : Colors.dark.text} 
                          />
                        </View>
                        <Text style={[
                          styles.menuItemText,
                          isActive && styles.menuItemTextActive
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  );
                })}
              </View>

              <View style={styles.menuFooter}>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
              </View>
            </Animated.View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  safeArea: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(10,10,20,0.7)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginLeft: Layout.spacing.sm,
  },
  logo: {
    width: 100,
    height: 32,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Layout.spacing.md,
    flex: 1,
  },
  iconButton: {
    padding: Layout.spacing.sm,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  searchModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  searchModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchModalBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  searchModalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    borderRadius: 16,
    padding: 20,
    zIndex: 2001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  menuModalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuModalBlur: {
    flex: 1,
    flexDirection: 'row',
  },
  menuModalBackdrop: {
    flex: 1,
  },
  menuContent: {
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: Colors.dark.card,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuLogo: {
    width: 100,
    height: 32,
  },
  closeButton: {
    padding: Layout.spacing.sm,
    borderRadius: 8,
  },
  menuItems: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  menuItemActive: {
    backgroundColor: 'rgba(162, 89, 255, 0.1)',
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(162, 89, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  menuItemText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  menuFooter: {
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    alignItems: 'center',
  },
  appVersion: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
});

export default Header;