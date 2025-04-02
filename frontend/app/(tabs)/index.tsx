import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, StatusBar, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MQTT_CONFIG } from '../../config/mqtt';
import Paho from 'paho-mqtt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Definir tópicos MQTT
const topics = {
  ledState: 'sensores/led',
  ledCommand: 'sensores/led',
  temperature: 'sensores/temperature',
  humidity: 'sensores/humidity',
  luminosity: 'sensores/luminosity',
  persianasPosition: 'sensores/motor/position',
  persianasCommand: 'sensores/motor/set',
  persianasMode: 'sensores/motor/mode',
  persianasControl: 'sensores/motor/pause_resume'
};

const MQTTPersianaControl = () => {
  const router = useRouter(); // Usar el hook useRouter al inicio del componente
  const [persianaAbierta, setPersianaAbierta] = useState(false);
  const [aperturaPersiana, setAperturaPersiana] = useState(0);
  const [client, setClient] = useState<Paho.Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presets] = useState([
    { nombre: 'Cerrar', valor: 100 },
    { nombre: 'Abrir', valor: 0 }
  ]);
  const [lastClickTime, setLastClickTime] = useState<{ [key: number]: number }>({});
  const [pausado, setPausado] = useState(false);
  // Estados para widgets
  const [temperaturaInterior, setTemperaturaInterior] = useState<number | null>(null);
  const [humedad, setHumedad] = useState<number | null>(null);
  const [luminosidad, setLuminosidad] = useState<number | null>(null);
  // Estado para el modo seleccionado
  const [modoActual, setModoActual] = useState('Manual');
  const [enMovimiento, setEnMovimiento] = useState(false);

  const TOPICO_PERSIANA = 'sensores/motor/control';
  const TOPICO_ESTADO = 'sensores/motor/estado';
  const tiempoDobleClick = 300;

  useEffect(() => {
    const cargarEstadoGuardado = async () => {
      try {
        const aperturaSaved = await AsyncStorage.getItem('aperturaPersiana');
        if (aperturaSaved !== null) {
          const valor = parseInt(aperturaSaved);
          setAperturaPersiana(valor);
          setPersianaAbierta(valor === 0);
        }
      } catch (e) {
        console.error('Error al cargar estado guardado:', e);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadoGuardado();
    connectClient();

    return () => {
      if (client && client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  const connectClient = () => {
    try {
      const mqttClient = new Paho.Client(
        MQTT_CONFIG.host,
        Number(MQTT_CONFIG.port),
        MQTT_CONFIG.path,
        `${MQTT_CONFIG.clientId}_${Math.random().toString(16).substr(2, 8)}`
      );

      mqttClient.onConnectionLost = (responseObject) => {
        setIsConnected(false);
        setTimeout(connectClient, 5000);
      };

      mqttClient.onMessageArrived = (message) => {
        // Actualización en tiempo real de la posición de la persiana
        if (message.destinationName === topics.persianasPosition || 
            message.destinationName === topics.persianasCommand || 
            message.destinationName === TOPICO_ESTADO) {
          try {
            let valorApertura;
            if (message.destinationName === TOPICO_ESTADO) {
              const estadoRecibido = JSON.parse(message.payloadString);
              valorApertura = estadoRecibido.apertura;
            } else {
              valorApertura = parseInt(message.payloadString);
            }

            if (!isNaN(valorApertura)) {
              setAperturaPersiana(valorApertura);
              setPersianaAbierta(valorApertura === 0);
              guardarEstado(valorApertura);
            }
          } catch (e) {
            console.error('Error procesando mensaje MQTT:', e);
          }
        }

        // Procesamiento de mensajes para los sensores
        if (message.destinationName === topics.temperature) {
          const valor = parseFloat(message.payloadString);
          if (!isNaN(valor)) {
            setTemperaturaInterior(valor);
          }
        }
        
        if (message.destinationName === topics.humidity) {
          const valor = parseInt(message.payloadString);
          if (!isNaN(valor)) {
            setHumedad(valor);
          }
        }
        
        if (message.destinationName === topics.luminosity) {
          const valor = parseInt(message.payloadString);
          if (!isNaN(valor)) {
            setLuminosidad(valor);
          }
        }
        
        if (message.destinationName === topics.persianasMode) {
          const modo = message.payloadString;
          if (modo === "manual" || modo === "auto" || modo === "programmed") {
            setModoActual(modo === "manual" ? "Manual" : 
                         modo === "auto" ? "Automático" : "Programado");
          }
        }
      };

      const connectOptions = {
        timeout: 3,
        keepAliveInterval: 60,
        cleanSession: true,
        useSSL: false,
        onSuccess: () => {
          setIsConnected(true);

          const topicosParaSuscribirse = [
            topics.ledState,
            topics.temperature,
            topics.humidity, 
            topics.luminosity,
            topics.persianasPosition,
            topics.persianasCommand,
            topics.persianasMode,
            TOPICO_ESTADO,
            'sensores/motor/+',
          ];
          
          topicosParaSuscribirse.forEach((topico) => {
            mqttClient.subscribe(topico);
          });

          const mensajeEstado = new Paho.Message(JSON.stringify({ comando: 'getEstado' }));
          mensajeEstado.destinationName = TOPICO_PERSIANA;
          mqttClient.send(mensajeEstado);

          setClient(mqttClient);
        },
        onFailure: (err: Paho.MQTTError) => {
          setIsConnected(false);
          Alert.alert(
            'Error de conexión',
            'No se pudo conectar al sistema de persianas. ¿Está encendido el controlador?',
            [
              { text: 'Reintentar', onPress: () => setTimeout(connectClient, 3000) },
              { text: 'Continuar sin conexión' }
            ]
          );
        }
      };

      mqttClient.connect(connectOptions);
    } catch (error) {
      console.error('Error al inicializar MQTT:', error);
      setIsConnected(false);
    }
  };

  const guardarEstado = async (valor: number) => {
    try {
      await AsyncStorage.setItem('aperturaPersiana', valor.toString());
    } catch (e) {
      console.error('Error al guardar estado:', e);
    }
  };

  const enviarComandoPersiana = (valor: number) => {
    if (client && client.isConnected()) {
      // El Arduino espera simplemente el valor numérico como string
      const message = new Paho.Message(String(valor));
      message.destinationName = topics.persianasCommand; // Usando el tópico correcto
      message.qos = 1;
      client.send(message);

      // Actualizar estado local
      setEnMovimiento(true);
      setTimeout(() => {
        setEnMovimiento(false);
        setAperturaPersiana(valor);
        setPersianaAbierta(valor === 0);
        guardarEstado(valor);
      }, 100); // Pequeño delay para mejor feedback visual
    }
  };

  const detenerPersiana = () => {
    if (client && client.isConnected()) {
      const message = new Paho.Message(JSON.stringify({ comando: 'detener' }));
      message.destinationName = TOPICO_PERSIANA;
      message.qos = 1;
      client.send(message);
      setEnMovimiento(false);
      setPausado(true);
    }
  };

  const abrirCerrarPersiana = () => {
    if (enMovimiento) {
      detenerPersiana();
    } else {
      // Si está detenida, abrir o cerrar completamente
      const nuevaPosicion = persianaAbierta ? 100 : 0;
      enviarComandoPersiana(nuevaPosicion);
    }
  };

  const aplicarPreset = (valor: number) => {
    const currentTime = new Date().getTime();
    const lastClick = lastClickTime[valor] || 0;
    
    if (currentTime - lastClick < tiempoDobleClick) { // 300ms como en el Arduino
      if (enMovimiento) {
        detenerPersiana();
      }
    } else {
      enviarComandoPersiana(valor);
    }
    
    setLastClickTime({ ...lastClickTime, [valor]: currentTime });
  };

  const cambiarModo = (modo: string) => {
    setModoActual(modo);
    
    // Enviar el cambio de modo al servidor
    if (client && client.isConnected()) {
      const modoParaEnviar = modo === 'Manual' ? 'manual' : 
                             modo === 'Automático' ? 'auto' : 'programmed';
      
      const message = new Paho.Message(modoParaEnviar);
      message.destinationName = topics.persianasMode;
      message.qos = 1;
      client.send(message);
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sí, salir",
          onPress: async () => {
            // Desconectar MQTT si está conectado
            if (client && client.isConnected()) {
              client.disconnect();
            }
  
            try {
              // Eliminar el token de usuario
              await AsyncStorage.removeItem('userToken');
              
              // También puedes limpiar otros datos de sesión específicos
              // await AsyncStorage.removeItem('userName');
              
              // Para una limpieza completa (opcional):
              // await AsyncStorage.clear();
  
              // Redirigir a la pantalla de inicio de sesión
              router.replace('/login');
            } catch (e) {
              console.error('Error al cerrar sesión:', e);
              Alert.alert(
                "Error",
                "No se pudo cerrar la sesión correctamente. Inténtalo de nuevo."
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Control de Persianas</Text>
        
        <View style={styles.headerRight}>
          <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
            <Text style={styles.connectionText}>{isConnected ? 'Conectado' : 'Desconectado'}</Text>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Panel de selección de modo */}
        <View style={styles.modeSelectionContainer}>
          <Text style={styles.modeSelectionTitle}>Modo de Operación</Text>
          <View style={styles.modeButtonsContainer}>
            <TouchableOpacity 
              style={[styles.modeButton, modoActual === 'Manual' && styles.modeButtonActive]}
              onPress={() => cambiarModo('Manual')}
            >
              <Ionicons name="hand-left-outline" size={20} color={modoActual === 'Manual' ? '#fff' : '#343a40'} />
              <Text style={[styles.modeButtonText, modoActual === 'Manual' && styles.modeButtonTextActive]}>Manual</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeButton, modoActual === 'Automático' && styles.modeButtonActive]}
              onPress={() => cambiarModo('Automático')}
            >
              <Ionicons name="flash-outline" size={20} color={modoActual === 'Automático' ? '#fff' : '#343a40'} />
              <Text style={[styles.modeButtonText, modoActual === 'Automático' && styles.modeButtonTextActive]}>Automático</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeButton, modoActual === 'Programado' && styles.modeButtonActive]}
              onPress={() => cambiarModo('Programado')}
            >
              <Ionicons name="calendar-outline" size={20} color={modoActual === 'Programado' ? '#fff' : '#343a40'} />
              <Text style={[styles.modeButtonText, modoActual === 'Programado' && styles.modeButtonTextActive]}>Programado</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Widgets de sensores */}
        <View style={styles.sensorsContainer}>
          <View style={[styles.sensorWidget, styles.singleWidget]}>
            <Ionicons name="thermometer-outline" size={24} color="#dc3545" />
            <Text style={styles.sensorValue}>{(temperaturaInterior ?? 0).toFixed(1)}°C</Text>
            <Text style={styles.sensorLabel}>Temperatura</Text>
          </View>
        </View>
        
        <View style={styles.sensorsContainer}>
          <View style={styles.sensorWidget}>
            <Ionicons name="water-outline" size={24} color="#0d6efd" />
            <Text style={styles.sensorValue}>{humedad ?? 0}%</Text>
            <Text style={styles.sensorLabel}>Humedad</Text>
          </View>
          
          <View style={styles.sensorWidget}>
            <Ionicons name="sunny-outline" size={24} color="#ffc107" />
            <Text style={styles.sensorValue}>{luminosidad ?? 0}</Text>
            <Text style={styles.sensorLabel}>Luminosidad</Text>
          </View>
        </View>

        <View style={styles.persianaVisualizacion}>
          <View style={[
            styles.ventana, 
            { backgroundColor: persianaAbierta ? '#28a745' : '#dc3545' }
          ]}>
          </View>
        </View>

        <View style={styles.presetsContainer}>
          <Text style={styles.presetsTitle}>Presets rápidos:</Text>
          <View style={styles.presetsButtons}>
            {presets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => aplicarPreset(preset.valor)}
              >
                <Text style={styles.presetName}>{preset.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    marginTop: 10, // Añadido para evitar que se corte en la parte superior
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  connected: {
    backgroundColor: '#d4edda',
  },
  disconnected: {
    backgroundColor: '#f8d7da',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Estilos para el panel de selección de modo
  modeSelectionContainer: {
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modeSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 10,
    textAlign: 'center',
  },
  modeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 5,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  modeButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#0069d9',
  },
  modeButtonText: {
    color: '#343a40',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  
  // Estilos para los widgets de sensores
  sensorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sensorWidget: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  singleWidget: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 15, // Aumentamos el padding vertical para mejor visualización
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
    marginVertical: 4,
  },
  sensorLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  
  persianaVisualizacion: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  ventana: {
    width: 200,
    height: 150,
    borderWidth: 4,
    borderColor: '#495057',
    borderRadius: 4,
  },
  presetsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#495057',
  },
  presetsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  presetButton: {
    width: '45%',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#343a40',
  },
});

export default MQTTPersianaControl;