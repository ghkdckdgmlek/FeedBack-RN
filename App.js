import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import LoginScreen from "./src/screens/Login&Register/LoginScreen";
import RegisterScreen from "./src/screens/Login&Register/RegisterScreen";
import RecordScreen from "./src/screens/1.js/RecordScreen";
import RecordingsScreen from "./src/screens/2.js/RecordingsScreen";
import AnalysisScreen from "./src/screens/2.js/AnalysisScreen";
import LogOutScreen from "./src/screens/3.js/LogOutScreen"; // 빈 화면 컴포넌트 추가
import {
  ChangeNameScreen,
  ChangeEmailScreen,
  ChangePasswordScreen,
} from "./src/screens/3.js/ChangeNameScreen";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomTabs from './src/screens/2.js/2-1.js/CustomTabs'; // CustomTabs import



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="녹음"
        component={RecordScreen}
        options={{
          tabBarLabel: "메인",
          tabBarIcon: ({ color, size }) => (
            <Icon name="microphone" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="보관함"
        component={RecordingsScreen}
        options={{
          tabBarLabel: "보관함",
          tabBarIcon: ({ color, size }) => (
            <Icon name="folder" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="설정"
        component={LogOutScreen}
        options={{
          tabBarLabel: "설정",
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} /> // 'cog' 아이콘을 사용하여 설정 아이콘을 표시합니다
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "MainTabs" : "Login"}
        >
          <Stack.Screen
            name="로그인"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="회원가입" component={RegisterScreen} />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="분석" component={AnalysisScreen} />
          <Stack.Screen
            name="ChangeName"
            component={ChangeNameScreen}
            options={{ title: "Change Name" }}
          />
          <Stack.Screen
            name="ChangeEmail"
            component={ChangeEmailScreen}
            options={{ title: "Change Email" }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: "Change Password" }}
          />
          <Stack.Screen
            name="에너지 분석 상세 결과" 
            component={CustomTabs}
            options={{ title: '에너지 분석 상세 결과' }}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
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
