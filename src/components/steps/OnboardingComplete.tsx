import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView
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
}

export const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({
  developerData,
  loading = false,
  onContinue,
  onLogout,
  autoFetch = false // Ignored - no auto fetching
}) => {
  // REMOVED: useEffect that logs waiting for data
  // REMOVED: handleRefresh function and related state

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
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{formattedKey}</Text>
            <View style={styles.infoValueContainer}>
              {typeof value === 'object' ? (
                <View style={styles.nestedObject}>
                  {Object.entries(value).map(([nestedKey, nestedValue]) => (
                    <View key={nestedKey} style={styles.nestedRow}>
                      <Text style={styles.nestedLabel}>
                        {nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </Text>
                      <Text style={styles.nestedValue}>
                        {String(nestedValue)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>
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
        <View key={index} style={styles.arrayItem}>
          <Text style={styles.arrayIndex}>Item {index + 1}</Text>
          {typeof item === 'object' 
            ? renderFormattedData(item)
            : <Text style={styles.infoValue}>{String(item)}</Text>
          }
        </View>
      ));
    }

    // Simple value
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoValue}>{String(data)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#0066CC', '#0099FF']}
                style={styles.loadingIcon}
              >
                <ActivityIndicator size="large" color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.loadingTitle}>Processing...</Text>
            <Text style={styles.loadingSubtitle}>
              Please wait while we complete your registration
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!developerData) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.gradient}
        >
          <View style={styles.emptyContainer}>
            <View style={[styles.iconContainer, styles.emptyIconContainer]}>
              <IconButton 
                icon="clock-outline" 
                size={48} 
                iconColor="#9CA3AF"
                style={styles.emptyIcon}
              />
            </View>
            <Text style={styles.emptyTitle}>Processing</Text>
            <Text style={styles.emptySubtitle}>
              Waiting for response from your backend...
            </Text>
            {/* REMOVED: Refresh button and loader - just show spinner */}
            <ActivityIndicator size="small" color="#0066CC" style={styles.refreshLoader} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon - Original Style */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.successIcon}
            >
              <IconButton icon="check" size={40} iconColor="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Title - Original Style */}
          <Text style={styles.title}>{UI_TEXTS.ONBOARDING_COMPLETE.TITLE}</Text>
          <Text style={styles.subtitle}>{UI_TEXTS.ONBOARDING_COMPLETE.SUBTITLE}</Text>

          {/* Developer Data Card - Preserving Original Card Style */}
          <Surface style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <IconButton icon="check-circle" size={24} iconColor="#10B981" />
              <Text style={styles.cardHeaderText}>Registration Details</Text>
            </View>
            
            <View style={styles.cardContent}>
              {renderFormattedData(developerData)}
            </View>
          </Surface>

          {/* Action Buttons - Original Style */}
          {onContinue && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
            >
              <LinearGradient
                colors={['#0066CC', '#0099FF']}
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
              <Text style={styles.logoutButtonText}>
                {UI_TEXTS.ONBOARDING_COMPLETE.LOGOUT_BUTTON}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.footerText}>
            {UI_TEXTS.ONBOARDING_COMPLETE.FOOTER}
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  // Loading Styles - Original
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
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Icon Styles - Original
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
  // Title Styles - Original
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  // Card Styles - Original from infoCard
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  cardContent: {
    padding: 16,
  },
  // Info Row Styles - Original from infoRow
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValueContainer: {
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  // Nested Object Styles
  nestedObject: {
    marginTop: 8,
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  nestedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  nestedLabel: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  nestedValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  // Array Styles
  arrayItem: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  arrayIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  // Button Styles - Original
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
    color: '#6B7280',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Empty State Styles - Original (modified to remove retry button)
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 60,
    padding: 10,
  },
  emptyIcon: {
    margin: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  // REMOVED: retryButton and retryButtonText styles
  refreshLoader: {
    marginTop: 16,
  },
});

export default OnboardingCompleteScreen;