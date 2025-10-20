import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Button, Loading } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import authService from '@/services/auth.service';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const googleConfig = authService.getGoogleConfig();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: googleConfig.iosClientId,
      android: googleConfig.androidClientId,
      default: googleConfig.webClientId,
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setLoading(true);
      await login(idToken);
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    promptAsync();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.title}>Split Expenses</Text>
          <Text style={styles.subtitle}>
            Share expenses with friends and family
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="✅" text="Create expense lists" />
          <FeatureItem icon="👥" text="Invite members" />
          <FeatureItem icon="📊" text="Track spending" />
          <FeatureItem icon="💸" text="Automatic reimbursements" />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign in with Google"
            onPress={handleLoginPress}
            disabled={!request || loading}
            loading={loading}
            size="large"
            style={styles.loginButton}
          />
          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  features: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#000000',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  loginButton: {
    width: '100%',
  },
  terms: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
