import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validaciones mejoradas
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  };

  const validateOnlyLetters = (text: string): boolean => {
    const letterRegex = /^[a-záéíóúñü\s]{2,}$/i;
    return letterRegex.test(text);
  };

  const validateOnlyNumbers = (text: string): boolean => {
    const numberRegex = /^\d{8,15}$/;
    return numberRegex.test(text);
  };

  const validatePassword = (pass: string): string => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (!minLength) return 'La contraseña debe tener al menos 8 caracteres';
    if (!hasUpperCase) return 'La contraseña debe incluir al menos una mayúscula';
    if (!hasNumber) return 'La contraseña debe incluir al menos un número';
    if (!hasSpecialChar) return 'La contraseña debe incluir al menos un carácter especial';
    return '';
  };

  const handleRegister = async () => {
    try {
      // Validar campos vacíos
      if (!nombre.trim() || !surname.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword) {
        Alert.alert('Error', 'Todos los campos son obligatorios');
        return;
      }

      // Validar longitud mínima del nombre y apellido
      if (nombre.trim().length < 2 || surname.trim().length < 2) {
        Alert.alert('Error', 'El nombre y apellido deben tener al menos 2 caracteres');
        return;
      }

      // Validar nombre y apellido
      if (!validateOnlyLetters(nombre.trim())) {
        Alert.alert('Error', 'El nombre solo puede contener letras');
        return;
      }

      if (!validateOnlyLetters(surname.trim())) {
        Alert.alert('Error', 'El apellido solo puede contener letras');
        return;
      }

      // Validar teléfono
      if (!validateOnlyNumbers(phone.trim())) {
        Alert.alert('Error', 'El teléfono debe contener entre 8 y 15 dígitos');
        return;
      }

      // Validar email
      if (!validateEmail(email.trim())) {
        Alert.alert('Error', 'El formato del correo electrónico no es válido');
        return;
      }

      // Validar contraseña
      const passwordError = validatePassword(password);
      if (passwordError) {
        Alert.alert('Error', passwordError);
        return;
      }

      // Validar confirmación de contraseña
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }

      // Si todas las validaciones pasan, continuar con el registro
      const requestBody = {
        name: nombre.trim(),
        surname: surname.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'cliente',
        status: 'active',
      };

      console.log("📦 Enviando datos al backend:", requestBody);

      try {
        setIsLoading(true);

        const res = await fetch('https://backendd-lidd.onrender.com/usuarios/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        if (res.ok) {
          Alert.alert('Éxito', 'Cuenta creada correctamente', [
            { text: 'OK', onPress: () => router.replace('/login') },
          ]);
        } else {
          Alert.alert('Error', data.message || 'Ocurrió un error al registrarte');
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo conectar al servidor');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo.jpeg')} 
                style={styles.logo} 
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Únete a JADA y conecta con la tecnología</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#888"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="people-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                placeholderTextColor="#888"
                value={surname}
                onChangeText={setSurname}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordInfo}>
              La contraseña debe contener al menos 8 caracteres, una mayúscula, un número y un carácter especial.
            </Text>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.disabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Registrarse</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.link}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1a3c61',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a3c61',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  passwordInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: '#3273dc',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    marginRight: 5,
  },
  link: {
    color: '#3273dc',
    fontWeight: 'bold',
  },
});