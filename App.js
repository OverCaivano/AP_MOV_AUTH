import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen';
import MoviesScreen from './screens/MoviesScreen';
import UserFormScreen from './screens/UserFormScreen';
import MovieDetailScreen from './screens/MovieDetailScreen';
import PasswordRecoveryScreen from './screens/PasswordRecoveryScreen';
import { initDB, getCurrentUserFromStorage } from './database';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        setInitialRoute('Login'); // Siempre comenzar en Login
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel de Administración' }} />
        <Stack.Screen name="Movies" component={MoviesScreen} options={{ title: 'Películas' }} />
        <Stack.Screen name="UserForm" component={UserFormScreen} options={({route})=>({ title: route?.params?.mode==='edit' ? 'Editar usuario' : 'Crear usuario' })} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} options={{ title: 'Detalles de la película' }} />
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} options={{ title: 'Recuperar Contraseña' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
