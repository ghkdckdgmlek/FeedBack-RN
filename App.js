import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import LoginScreen from './src/screens/Login&Register/LoginScreen';
import RegisterScreen from './src/screens/Login&Register/RegisterScreen';
import RecordScreen from './src/screens/RecordScreen';
import RecordingsScreen from './src/screens/RecordingsScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import EmptyScreen from './src/screens/EmptyScreen'; // 빈 화면 컴포넌트 추가
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="녹음"
        component={RecordScreen}
        options={{
          tabBarLabel: '메인',
          tabBarIcon: ({ color, size }) => (
            <Icon name="microphone" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="보관함"
        component={RecordingsScreen}
        options={{
          tabBarLabel: '보관함',
          tabBarIcon: ({ color, size }) => (
            <Icon name="folder" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="빈칸"
        component={EmptyScreen}
        options={{
          tabBarLabel: '빈칸',
          tabBarIcon: ({ color, size }) => (
            <Icon name="ellipsis-h" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "MainTabs" : "Login"}>
        <Stack.Screen name="로그인" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="회원가입" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="분석" component={AnalysisScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
};

export default App;
