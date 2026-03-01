import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import {
  Text,
  Surface,
  ActivityIndicator,
  IconButton
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { UI_TEXTS } from '../../etc/constants';

interface OnboardingCompleteScreenProps {
  developerData?: any; // Only developer-provided data
  loading?: boolean;
  onContinue?: () => void;
  onLogout?: () => void;
  autoFetch?: boolean; // Kept for backward compatibility but ignored
  // New theme props for developer customization
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    cardColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

// Default AirXPay branding colors (fixed - developer can't change these)
const AIRXPAY_BRANDING = {
  logo: require('../../assets/images/airxpay.png'),
  name: 'AirXPay',
  tagline: 'Powered by AirXPay',
  copyright: '© 2024 AirXPay. All rights reserved.',
};

export const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({
  developerData,
  loading = false,
  onContinue,
  onLogout,
  autoFetch = false,
  theme = {} // Developer can customize these
}) => {
  // Merge developer theme with defaults
  const customTheme = {
    primaryColor: theme.primaryColor || '#0066CC',
    secondaryColor: theme.secondaryColor || '#0099FF',
    backgroundColor: theme.backgroundColor || '#FFFFFF',
    cardColor: theme.cardColor || '#F8F9FA',
    textColor: theme.textColor || '#111827',
    accentColor: theme.accentColor || '#10B981',
  };

  // Function to format and display developer data in a beautiful way
  const renderFormattedData = (data: any) => {
    if (!data) return null;

    // If data is a simple object, show it in a card format
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data).map(([key, value]) => {
        // Skip rendering if value is null/undefined
        if (value === null || value === undefined) return null;

        // Format the key to be more readable
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        return (
          <View key={key} style={[styles.infoRow, { borderBottomColor: customTheme.cardColor }]}>
            <Text style={[styles.infoLabel, { color: customTheme.textColor + '80' }]}>{formattedKey}</Text>
            <View style={styles.infoValueContainer}>
              {typeof value === 'object' ? (
                <View style={[styles.nestedObject, { borderLeftColor: customTheme.cardColor }]}>
                  {Object.entries(value).map(([nestedKey, nestedValue]) => (
                    <View key={nestedKey} style={styles.nestedRow}>
                      <Text style={[styles.nestedLabel, { color: customTheme.textColor + '80' }]}>
                        {nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </Text>
                      <Text style={[styles.nestedValue, { color: customTheme.textColor }]}>
                        {String(nestedValue)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.infoValue, { color: customTheme.textColor }]}>
                  {typeof value === 'boolean' 
                    ? (value ? 'Yes' : 'No')
                    : String(value)
                  }
                </Text>
              )}
            </View>
          </View>
        );
      });
    }

    // If data is an array, show it in a list
    if (Array.isArray(data)) {
      return data.map((item, index) => (
        <View key={index} style={[styles.arrayItem, { backgroundColor: customTheme.cardColor }]}>
          <Text style={[styles.arrayIndex, { color: customTheme.textColor }]}>Item {index + 1}</Text>
          {typeof item === 'object' 
            ? renderFormattedData(item)
            : <Text style={[styles.infoValue, { color: customTheme.textColor }]}>{String(item)}</Text>
          }
        </View>
      ));
    }

    // Simple value
    return (
      <View style={[styles.infoRow, { borderBottomColor: customTheme.cardColor }]}>
        <Text style={[styles.infoValue, { color: customTheme.textColor }]}>{String(data)}</Text>
      </View>
    );
  };

  // AirXPay Branding Component (Fixed - Developer can't change this)
  const AirXPayBranding = () => (
    <View style={styles.brandingContainer}>
      <Image 
        source={AIRXPAY_BRANDING.logo}
        style={styles.brandingLogo}
        resizeMode="contain"
      />
      <Text style={styles.brandingName}>{AIRXPAY_BRANDING.name}</Text>
      <Text style={styles.brandingTagline}>{AIRXPAY_BRANDING.tagline}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: customTheme.backgroundColor }]}>
        <LinearGradient
          colors={[customTheme.backgroundColor, customTheme.cardColor]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            {/* Fixed AirXPay Branding at top */}
            <AirXPayBranding />
            
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[customTheme.primaryColor, customTheme.secondaryColor]}
                style={styles.loadingIcon}
              >
                <ActivityIndicator size="large" color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={[styles.loadingTitle, { color: customTheme.textColor }]}>Processing...</Text>
            <Text style={[styles.loadingSubtitle, { color: customTheme.textColor + '80' }]}>
              Please wait while we complete your registration
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!developerData) {
    return (
      <View style={[styles.container, { backgroundColor: customTheme.backgroundColor }]}>
        <LinearGradient
          colors={[customTheme.backgroundColor, customTheme.cardColor]}
          style={styles.gradient}
        >
          <View style={styles.emptyContainer}>
            {/* Fixed AirXPay Branding at top */}
            <AirXPayBranding />
            
            <View style={[styles.iconContainer, styles.emptyIconContainer, { backgroundColor: customTheme.cardColor }]}>
              <IconButton 
                icon="clock-outline" 
                size={48} 
                iconColor={customTheme.textColor + '80'}
                style={styles.emptyIcon}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: customTheme.textColor }]}>Processing</Text>
            <Text style={[styles.emptySubtitle, { color: customTheme.textColor + '80' }]}>
              Waiting for response from your backend...
            </Text>
            <ActivityIndicator size="small" color={customTheme.primaryColor} style={styles.refreshLoader} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: customTheme.backgroundColor }]}>
      <LinearGradient
        colors={[customTheme.backgroundColor, customTheme.cardColor]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Fixed AirXPay Branding at top */}
          <AirXPayBranding />

          {/* Success Icon - Using custom theme colors */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[customTheme.accentColor, customTheme.primaryColor]}
              style={styles.successIcon}
            >
              <IconButton icon="check" size={40} iconColor="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Title - Original Style with custom text color */}
          <Text style={[styles.title, { color: customTheme.textColor }]}>{UI_TEXTS.ONBOARDING_COMPLETE.TITLE}</Text>
          <Text style={[styles.subtitle, { color: customTheme.textColor + '80' }]}>{UI_TEXTS.ONBOARDING_COMPLETE.SUBTITLE}</Text>

          {/* Developer Data Card - Using custom theme colors */}
          <Surface style={[styles.infoCard, { backgroundColor: customTheme.backgroundColor }]}>
            <View style={[styles.cardHeader, { borderBottomColor: customTheme.cardColor }]}>
              <IconButton icon="check-circle" size={24} iconColor={customTheme.accentColor} />
              <Text style={[styles.cardHeaderText, { color: customTheme.textColor }]}>Registration Details</Text>
            </View>
            
            <View style={styles.cardContent}>
              {renderFormattedData(developerData)}
            </View>
          </Surface>

          {/* Action Buttons - Using custom theme colors */}
          {onContinue && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
            >
              <LinearGradient
                colors={[customTheme.primaryColor, customTheme.secondaryColor]}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>
                  {UI_TEXTS.ONBOARDING_COMPLETE.CONTINUE_BUTTON}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={[styles.logoutButtonText, { color: customTheme.textColor + '80' }]}>
                {UI_TEXTS.ONBOARDING_COMPLETE.LOGOUT_BUTTON}
              </Text>
            </TouchableOpacity>
          )}

          {/* Fixed AirXPay Footer */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: customTheme.textColor + '60' }]}>
              {AIRXPAY_BRANDING.copyright}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// Updated styles with branding styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  // Branding Styles (Fixed - Developer can't override these)
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  brandingLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  brandingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066CC', // Fixed AirXPay blue
    marginBottom: 2,
  },
  brandingTagline: {
    fontSize: 12,
    color: '#666666', // Fixed gray
    fontWeight: '500',
  },
  footerContainer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Icon Styles
  iconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Title Styles
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Card Styles
  infoCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardContent: {
    padding: 16,
  },
  // Info Row Styles
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValueContainer: {
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Nested Object Styles
  nestedObject: {
    marginTop: 8,
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
  },
  nestedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  nestedLabel: {
    fontSize: 13,
    flex: 1,
  },
  nestedValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  // Array Styles
  arrayItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  arrayIndex: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  // Button Styles
  continueButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    borderRadius: 60,
    padding: 10,
  },
  emptyIcon: {
    margin: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  refreshLoader: {
    marginTop: 16,
  },
});

export default OnboardingCompleteScreen;