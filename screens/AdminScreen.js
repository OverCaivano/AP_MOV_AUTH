import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import { getAllUsers, deleteUser, getCurrentUserFromStorage, removeCurrentUserFromStorage } from '../database';

export default function AdminScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(()=>{
    const unsubscribe = navigation.addListener('focus', ()=> load());
    load();
    return unsubscribe;
  },[]);

  const load = async ()=>{
    const all = await getAllUsers();
    setUsers(all);
    const cur = await getCurrentUserFromStorage();
    setMe(cur);
  };

  const handleDelete = (user) => {
    if (!me) return;
    if (user.id === me.id) {
      Alert.alert('Atención','No puedes eliminarte a ti mismo');
      return;
    }
    Alert.alert('Confirmar','Eliminar usuario?', [
      {text:'Cancelar', style:'cancel'},
      {text:'Eliminar', style:'destructive', onPress: async ()=> { await deleteUser(user.id); load(); }}
    ]);
  };

  const logout = async ()=>{
    await removeCurrentUserFromStorage();
    navigation.reset({ index:0, routes:[{name:'Login'}] });
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:12}}>
        <Text style={styles.title}>Gestión de usuarios</Text>
        <Button title="Cerrar sesión" onPress={logout} />
      </View>
      <Button title="Crear usuario" onPress={()=>navigation.navigate('UserForm',{mode:'add'})} />
      <FlatList data={users} keyExtractor={(i)=>String(i.id)} style={{marginTop:12}}
        renderItem={({item})=> (
          <View style={styles.row}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:'600'}}>{item.name} ({item.role})</Text>
              <Text>{item.username}</Text>
            </View>
            <View style={{justifyContent:'center'}}>
              <Button title="Editar" onPress={()=>navigation.navigate('UserForm',{mode:'edit', user:item})} />
              <View style={{height:6}} />
              <Button title="Eliminar" color="#d11a2a" onPress={()=>handleDelete(item)} />
            </View>
          </View>
        )}
        ListEmptyComponent={()=> <Text style={{marginTop:20}}>No hay usuarios</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16},
  title:{fontSize:20, fontWeight:'700'},
  row:{flexDirection:'row', padding:12, backgroundColor:'#f2f2f2', marginBottom:8, borderRadius:8}
});
