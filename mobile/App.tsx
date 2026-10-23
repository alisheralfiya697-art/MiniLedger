/**
 * @file mobile/App.tsx
 * @description Main React Native application entry point with NavigationContainer and StackNavigator.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/types';

// Screen imports (in React Native build)
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddLoanScreen from './src/screens/AddLoanScreen';
import LoanDetailsScreen from './src/screens/LoanDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#0f172a',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#f8fafc',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ 
            title: 'MiniLedger',
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="AddLoan" 
          component={AddLoanScreen} 
          options={{ title: 'Add New Loan' }} 
        />
        <Stack.Screen 
          name="LoanDetails" 
          component={LoanDetailsScreen} 
          options={{ title: 'Loan Details' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
