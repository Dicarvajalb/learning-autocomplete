import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { ActionButton } from '../components/ui';
import { getApiBaseUrl } from '../services/quizApi';
import { useAppStore } from '../store/appStore';
import { styles } from '../theme/styles';

export function HomePage() {
  const { syncRoute } = useAppStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Learning DevOps</Text>
          <Text style={styles.title}>Choose a path</Text>
          <Text style={styles.subtitle}>
            Log in to manage quizzes, or browse the public catalog first.
          </Text>
          <Text style={styles.meta}>API base: {getApiBaseUrl()}</Text>
          <View style={styles.heroButtons}>
            <ActionButton label="Login" onPress={() => syncRoute('login')} />
            <ActionButton
              label="Search quizzes"
              onPress={() => syncRoute('search')}
              variant="secondary"
            />
            <ActionButton
              label="Join session"
              onPress={() => syncPath('/sessions/join')}
              variant="ghost"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
