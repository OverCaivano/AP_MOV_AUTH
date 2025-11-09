import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { getUserByCredentials, setCurrentUserInStorage } from '../database';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const doLogin = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        Alert.alert('Error','Ingrese usuario y contraseña');
        return;
      }
      console.log('Intentando login con:', username.trim());
      const user = await getUserByCredentials(username.trim(), password.trim());
      console.log('Resultado de getUserByCredentials:', user);
      
      if (!user) {
        Alert.alert('Error','Credenciales inválidas');
        return;
      }
      
      await setCurrentUserInStorage(user);
      console.log('Usuario guardado en storage:', user);
      
      if (user.role === 'admin') {
        navigation.reset({ index:0, routes:[{name:'Admin'}] });
      } else {
        navigation.reset({ index:0, routes:[{name:'Movies'}] });
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar iniciar sesión: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput placeholder="Usuario" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <View style={styles.buttonContainer}>
        <Button title="Entrar" onPress={doLogin} />
        <TouchableOpacity 
          onPress={() => navigation.navigate('PasswordRecovery')}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16, justifyContent:'center'},
  title:{fontSize:24, textAlign:'center', marginBottom:20},
  buttonContainer: {
    marginTop: 10
  },
  forgotPassword: {
    marginTop: 15,
    alignItems: 'center'
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14
  },
  input:{borderWidth:1, borderColor:'#ccc', padding:10, marginBottom:12, borderRadius:6}
});
