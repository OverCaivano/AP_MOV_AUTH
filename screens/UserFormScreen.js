import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { createUser, updateUser } from '../database';

export default function UserFormScreen({ navigation, route }) {
  const mode = route.params?.mode || 'add';
  const user = route.params?.user;
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'user');

  const save = async ()=>{
    if (!name.trim() || !username.trim()) { Alert.alert('Error','Nombre y username son obligatorios'); return; }
    try {
      if (mode === 'edit') {
        await updateUser(user.id, name, username, password || user.password, role);
      } else {
        await createUser(name, username, password || '1234', role);
      }
      navigation.goBack();
    } catch(e) {
      Alert.alert('Error', e.message || 'Ocurrió un error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{marginBottom:8}}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={{marginBottom:8}}>Usuario</Text>
      <TextInput autoCapitalize="none" style={styles.input} value={username} onChangeText={setUsername} />
      <Text style={{marginBottom:8}}>Contraseña (dejar vacío para mantener)</Text>
      <TextInput secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
      <Text style={{marginBottom:8}}>Rol (admin o user)</Text>
      <TextInput style={styles.input} value={role} onChangeText={setRole} />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16},
  input:{borderWidth:1,borderColor:'#ccc',padding:8,marginBottom:12,borderRadius:6}
});
