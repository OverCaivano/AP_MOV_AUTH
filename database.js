import { openDatabase } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// This file implements a SQLite-backed API with a full AsyncStorage fallback.
// Purpose: allow the app to run in Expo Go (where native sqlite may not match)
// while preferring SQLite when available (dev-client / built app).

const DATABASE_NAME = 'users.db';
const CURRENT_USER_KEY = '@user';
const USERS_KEY = '@users_fallback';

let db = null;
let sqliteAvailable = true;

const tryOpenDb = () => {
  if (db) return db;
  try {
    if (Platform.OS === 'web') {
      sqliteAvailable = false;
      return null;
    }
    db = openDatabase(DATABASE_NAME);
    return db;
  } catch (e) {
    console.warn('SQLite not available, using AsyncStorage fallback:', e && e.message);
    sqliteAvailable = false;
    db = null;
    return null;
  }
};

export const getDb = () => {
  return tryOpenDb();
};

export const getCurrentUserFromStorage = async () => {
  try {
    const userStr = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const setCurrentUserInStorage = async (user) => {
  try {
    if (user) {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('Error setting current user:', error);
  }
};

export const removeCurrentUserFromStorage = async () => {
  try {
    console.log('Removiendo usuario actual del storage');
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('Usuario removido exitosamente');
  } catch (error) {
    console.error('Error removing current user:', error);
    throw error;
  }
};

// Lightweight wrappers: if sqlite available, use it; otherwise operate on AsyncStorage list
const executeSql = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDb();
    if (!database) return reject(new Error('SQLite not available'));
    database.transaction(
      tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      },
      err => reject(err)
    );
  });
};

// AsyncStorage helpers for fallback user store
const readUsersFallback = async () => {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading users fallback:', e);
    return [];
  }
};

const writeUsersFallback = async users => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error writing users fallback:', e);
  }
};

let nextFallbackId = async () => {
  const users = await readUsersFallback();
  const max = users.reduce((m, u) => (u.id && u.id > m ? u.id : m), 0);
  return max + 1;
};

export const initDB = async () => {
  console.log('Iniciando inicialización de la base de datos');
  
  // Limpiar cualquier sesión anterior al iniciar
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('Sesión anterior limpiada');
  } catch (e) {
    console.warn('Error al limpiar sesión:', e);
  }
  
  let usingFallback = false;
  
  // Try to open DB; if it fails, fall back to AsyncStorage without throwing.
  try {
    const database = getDb();
    console.log('Estado de la base de datos:', database ? 'Disponible' : 'No disponible');
    
    if (database) {
      // Create table if possible
      console.log('Creando tabla de usuarios si no existe...');
      await executeSql(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL
        );
      `);
      
      // Verificar si existe el usuario admin
      console.log('Verificando usuario admin...');

      const result = await executeSql('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      const count = (result && result.rows && result.rows._array && result.rows._array[0] && result.rows._array[0].count) || 0;
      if (count === 0) {
        await executeSql('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', ['Admin', 'admin', 'admin', 'admin']);
      }
      sqliteAvailable = true;
      return { sqlite: true };
    }
  } catch (e) {
    console.warn('SQLite init failed, falling back to AsyncStorage:', e && e.message);
    sqliteAvailable = false;
  }

  // Asegurarnos que el usuario admin existe en cualquier caso
  console.log('Verificando existencia del usuario admin...');
  await ensureAdminUser();
  
  // Verificar si estamos usando SQLite o fallback
  const isUsingSql = sqliteAvailable && !!getDb();
  console.log('Modo de almacenamiento:', isUsingSql ? 'SQLite' : 'AsyncStorage');
  
  return { sqlite: isUsingSql };
};

export const createUser = async (name, username, password, role = 'user') => {
  if (sqliteAvailable && getDb()) {
    const result = await executeSql('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', [name, username, password, role]);
    return { id: result.insertId || null, name, username, role };
  }

  const users = await readUsersFallback();
  const id = await nextFallbackId();
  const user = { id, name, username, password, role };
  users.unshift(user);
  await writeUsersFallback(users);
  return { id, name, username, role };
};

export const getAllUsers = async () => {
  if (sqliteAvailable && getDb()) {
    const result = await executeSql('SELECT id, name, username, role FROM users ORDER BY id DESC');
    return result.rows._array;
  }
  const users = await readUsersFallback();
  return users.map(({ id, name, username, role }) => ({ id, name, username, role }));
};

export const getUserByCredentials = async (username, password) => {
  try {
    console.log('Verificando credenciales para:', username);
    console.log('Estado SQLite:', { disponible: sqliteAvailable, db: !!getDb() });
    
    // Intento con SQLite primero
    if (sqliteAvailable && getDb()) {
      try {
        console.log('Intentando autenticación con SQLite...');
        const result = await executeSql(
          'SELECT id, name, username, role FROM users WHERE username = ? AND password = ? LIMIT 1',
          [username, password]
        );
        
        console.log('Resultado SQLite:', {
          tieneFilas: !!result.rows,
          numFilas: result.rows?._array?.length,
          datos: result.rows?._array
        });
        
        if (result.rows?._array?.[0]) {
          const user = result.rows._array[0];
          console.log('Usuario encontrado en SQLite:', user);
          await setCurrentUserInStorage(user);
          return user;
        }
      } catch (sqliteError) {
        console.error('Error en autenticación SQLite:', sqliteError);
      }
    }
    
    // Fallback a AsyncStorage
    console.log('Iniciando fallback a AsyncStorage...');
    const users = await readUsersFallback();
    console.log('Usuarios en AsyncStorage:', users?.length || 0);
    
    // Buscar usuario que coincida
    const user = users.find(u => 
      u.username === username && 
      u.password === password
    );
    
    if (user) {
      console.log('Usuario encontrado en AsyncStorage:', {
        id: user.id,
        username: user.username,
        role: user.role
      });
      
      const userData = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      };
      
      await setCurrentUserInStorage(userData);
      return userData;
    }
    
    console.log('No se encontró el usuario en ningún almacenamiento');
    return null;
    
  } catch (error) {
    console.error('Error crítico en getUserByCredentials:', error);
    throw new Error('Error al verificar credenciales: ' + error.message);
  }
}

export const getUserById = async (id) => {
  if (sqliteAvailable && getDb()) {
    const result = await executeSql('SELECT id, name, username, role FROM users WHERE id = ?', [id]);
    return result.rows._array[0] || null;
  }
  const users = await readUsersFallback();
  const user = users.find(u => u.id === id) || null;
  return user ? { id: user.id, name: user.name, username: user.username, role: user.role } : null;
};

export const updateUser = async (id, name, username, password, role) => {
  console.log('Actualizando usuario:', { id, name, username, role });
  
  try {
    if (sqliteAvailable && getDb()) {
      console.log('Usando SQLite para actualizar usuario');
      await executeSql(
        'UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ?',
        [name, username, password, role, id]
      );
      console.log('Usuario actualizado en SQLite');
      return { id, name, username, role };
    }

    console.log('Usando AsyncStorage para actualizar usuario');
    const users = await readUsersFallback();
    const idx = users.findIndex(u => u.id === id);
    
    if (idx === -1) {
      console.error('Usuario no encontrado en AsyncStorage');
      throw new Error('Usuario no encontrado');
    }
    
    users[idx] = { id, name, username, password, role };
    await writeUsersFallback(users);
    console.log('Usuario actualizado en AsyncStorage');
    
    return { id, name, username, role };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  const currentUser = await getCurrentUserFromStorage();
  if (currentUser && currentUser.id === id) {
    throw new Error('Cannot delete the currently logged in user');
  }
  if (sqliteAvailable && getDb()) {
    await executeSql('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
  let users = await readUsersFallback();
  users = users.filter(u => u.id !== id);
  await writeUsersFallback(users);
  return true;
};

export const getUserByUsername = async (username) => {
  try {
    console.log('Buscando usuario por username:', username);
    
    if (sqliteAvailable && getDb()) {
      console.log('Usando SQLite para buscar usuario');
      const result = await executeSql(
        'SELECT id, name, username, password, role FROM users WHERE username = ? LIMIT 1',
        [username]
      );
      console.log('Resultado SQLite:', result.rows._array);
      return result.rows._array[0] || null;
    }

    console.log('Usando AsyncStorage para buscar usuario');
    const users = await readUsersFallback();
    console.log('Total usuarios en AsyncStorage:', users?.length);
    
    const user = users.find(u => u.username === username);
    console.log('Usuario encontrado en AsyncStorage:', user ? 'Sí' : 'No');
    
    if (user) {
      console.log('Datos del usuario:', {
        id: user.id,
        username: user.username,
        role: user.role
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error en getUserByUsername:', error);
    throw error;
  }
};

// Helper para asegurarnos que el usuario admin existe
const ensureAdminUser = async () => {
  try {
    if (sqliteAvailable && getDb()) {
      const result = await executeSql('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
      const count = result?.rows?._array?.[0]?.count || 0;
      
      if (count === 0) {
        console.log('Creando usuario admin en SQLite...');
        await executeSql(
          'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
          ['Admin', 'admin', 'admin', 'admin']
        );
      } else {
        console.log('Usuario admin ya existe en SQLite');
      }
    } else {
      const users = await readUsersFallback();
      const hasAdmin = users.some(u => u.username === 'admin');
      
      if (!hasAdmin) {
        console.log('Creando usuario admin en AsyncStorage...');
        const id = await nextFallbackId();
        users.push({
          id,
          name: 'Admin',
          username: 'admin',
          password: 'admin',
          role: 'admin'
        });
        await writeUsersFallback(users);
      } else {
        console.log('Usuario admin ya existe en AsyncStorage');
      }
    }
  } catch (error) {
    console.error('Error al asegurar usuario admin:', error);
  }
};

// Expose whether we are using sqlite or fallback (helpful for debugging)
export const isUsingSqlite = () => !!(sqliteAvailable && db);
