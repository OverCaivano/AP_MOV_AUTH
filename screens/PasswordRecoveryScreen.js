import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { updateUser, getUserByUsername } from '../database';

export default function PasswordRecoveryScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: username, 2: new password
  const [verifiedUser, setVerifiedUser] = useState(null); // Guardar el usuario verificado

  const handleVerifyUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Por favor ingrese su nombre de usuario');
      return;
    }

    try {
      console.log('Verificando usuario:', username.trim());
      const user = await getUserByUsername(username.trim());
      console.log('Resultado de verificación:', user);
      
      if (!user) {
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }
      
      setVerifiedUser(user); // Guardar el usuario verificado
      setStep(2);
    } catch (error) {
      console.error('Error verificando usuario:', error);
      Alert.alert('Error', 'Ocurrió un error al verificar el usuario');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!verifiedUser) {
      Alert.alert('Error', 'Por favor verifique su usuario primero');
      setStep(1);
      return;
    }

    try {
      console.log('Actualizando contraseña para usuario:', verifiedUser);
      
      // Usar el usuario verificado guardado anteriormente
      await updateUser(
        verifiedUser.id,
        verifiedUser.name,
        verifiedUser.username,
        newPassword,
        verifiedUser.role
      );
      
      Alert.alert(
        'Éxito',
        'Contraseña actualizada correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar la contraseña');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Contraseña</Text>
      
      {step === 1 ? (
        <>
          <Text style={styles.label}>Ingrese su nombre de usuario:</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Nombre de usuario"
            autoCapitalize="none"
          />
          <Button title="Verificar Usuario" onPress={handleVerifyUsername} />
        </>
      ) : (
        <>
          <Text style={styles.label}>Ingrese su nueva contraseña:</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nueva contraseña"
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmar contraseña"
            secureTextEntry
          />
          <Button title="Cambiar Contraseña" onPress={handleChangePassword} />
        </>
      )}
      
      <Button
        title="Cancelar"
        onPress={() => navigation.goBack()}
        color="#666"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  }
});