import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform, 
  Animated, 
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Link, usePathname } from 'expo-router';
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
  isSearchBarVisible?: boolean; // new prop to control search bar visibility
  onSearchToggle?: (visible: boolean) => void; // callback for parent
}

const Header = forwardRef<HeaderRef, HeaderProps>(({ title, showSearch = true, onMenuPress, isSearchBarVisible: propIsSearchBarVisible = false, onSearchToggle }, ref) => {
  const pathname = usePathname();
  // Use internal state if onSearchToggle is not provided
  const [internalIsSearchBarVisible, setInternalIsSearchBarVisible] = useState(false);
  const isSearchBarVisible = onSearchToggle ? propIsSearchBarVisible : internalIsSearchBarVisible;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [menuAnimation] = useState(new Animated.Value(0));
  const [overlayAnimation] = useState(new Animated.Value(0));
  const [menuItemsAnimation] = useState(new Animated.Value(0));

  useImperativeHandle(ref, () => ({
    handleScroll: (value: number) => {
      scrollY.setValue(value);
    },
  }));

  // Header background color based on scroll - more translucent
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 30, 80],
    outputRange: [
      'rgba(10,10,20,0)',    // fully transparent at rest
      'rgba(10,10,20,0.2)',  // slightly visible
      'rgba(10,10,20,0.4)'   // more visible but still translucent
    ],
    extrapolate: 'clamp',
  });

  // Header blur intensity - stronger blur effect
  const blurIntensity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 30],  // reduced max blur for more subtle effect
    extrapolate: 'clamp',
  });

  // Header blur opacity - make it more subtle
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 0.9],
    extrapolate: 'clamp',
  });

  const toggleMenu = () => {
    if (isMenuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  };
  // Ensure no numeric style indices are set anywhere in menu logic (none present here)

  const openMenu = () => {
    setIsMenuVisible(true);
    
    // Reset menu items animation
    menuItemsAnimation.setValue(0);
    
    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate menu items after menu opens
      Animated.timing(menuItemsAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.spring(menuAnimation, {
        toValue: 0,
        tension: 120,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuItemsAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMenuVisible(false);
    });
  };

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-MENU_WIDTH, 0],
  });

  const overlayOpacity = overlayAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const menuItemOpacity = menuItemsAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuItemTranslateY = menuItemsAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

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

  const MenuItem = ({ item, onPress, index, isActive }: { 
    item: typeof menuItems[0], 
    onPress: () => void, 
    index: number,
    isActive: boolean
  }) => {
    const itemDelay = menuItemsAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1 - (index * 0.1)],
    });
  
    return (
      <Animated.View
        style={{
          opacity: menuItemOpacity,
          transform: [
            { 
              translateY: menuItemTranslateY.interpolate({
                inputRange: [0, 1],
                outputRange: [20 + (index * 5), 0],
              })
            },
            { scale: itemDelay }
          ],
        }}
      >
        <Link href={item.route} asChild>
          <TouchableOpacity 
            style={[styles.menuItem, isActive && styles.menuItemActive]} 
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <item.icon size={18} color={isActive ? Colors.dark.primary : Colors.dark.text} />
            </View>
            <Text style={[styles.menuItemText, isActive && { color: Colors.dark.primary }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.container, { backgroundColor: headerBackgroundColor }]}>
          {/* Header Background with Blur */}
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
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
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
  searchModalContainer: {
    position: 'fixed',
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBackButton: {
    padding: Layout.spacing.sm,
    marginRight: Layout.spacing.sm,
  },
  searchBarWrapper: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    width: MENU_WIDTH,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 0) + 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  closeButton: {
    padding: Layout.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: 'rgba(162, 89, 255, 0.1)',
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(162, 89, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  menuContent: {
    marginTop: 30,
    paddingHorizontal: 4,
  },
  menuHeader: {
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  menuLogo: {
    width: 100,
    height: 30,
    resizeMode: 'contain',
  },
  menuFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  appVersion: {
    color: Colors.dark.subtext,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '400',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
});

export default Header;