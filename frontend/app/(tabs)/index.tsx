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
  weatherData: 'sensores/weather'
};

const MQTTPersianaControl = () => {
  const router = useRouter(); // Usar el hook useRouter al inicio del componente
  const [persianaAbierta, setPersianaAbierta] = useState(false);
  const [aperturaPersiana, setAperturaPersiana] = useState(0);
  const [client, setClient] = useState<Paho.Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState([
    { nombre: 'Abierta', valor: 100 },
    { nombre: 'Entre abierta', valor: 50 },
    { nombre: 'Cerrada', valor: 0 },
  ]);
  // Estados para widgets
  const [temperaturaInterior, setTemperaturaInterior] = useState<number | null>(null);
  const [temperaturaExterior, setTemperaturaExterior] = useState<number | null>(null);
  const [humedad, setHumedad] = useState<number | null>(null);
  const [luminosidad, setLuminosidad] = useState<number | null>(null);
  // Estado para el modo seleccionado
  const [modoActual, setModoActual] = useState('Manual');

  const TOPICO_PERSIANA = 'sensores/motor/control';
  const TOPICO_ESTADO = 'sensores/motor/estado';

  useEffect(() => {
    const cargarEstadoGuardado = async () => {
      try {
        const aperturaSaved = await AsyncStorage.getItem('aperturaPersiana');
        if (aperturaSaved !== null) {
          const valor = parseInt(aperturaSaved);
          setAperturaPersiana(valor);
          setPersianaAbierta(valor > 0);
        }

        const presetsSaved = await AsyncStorage.getItem('presetsPersiana');
        if (presetsSaved !== null) {
          setPresets(JSON.parse(presetsSaved));
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
              setPersianaAbierta(valorApertura > 0);
              guardarEstado(valorApertura);
            }
          } catch (e) {
            // Error silencioso
          }
        }

        // Procesamiento de mensajes para los sensores
        if (message.destinationName === topics.temperature) {
          const valor = parseFloat(message.payloadString);
          if (!isNaN(valor)) {
            setTemperaturaInterior(valor);
          }
        }
        
        if (message.destinationName === topics.weatherData) {
          try {
            const data = JSON.parse(message.payloadString);
            if (data && data.temperature) {
              setTemperaturaExterior(data.temperature);
            }
          } catch (e) {
            console.error('Error parsing weather data:', e);
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
            topics.weatherData,
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

  const guardarPresets = async (nuevosPresets: { nombre: string; valor: number }[]) => {
    try {
      await AsyncStorage.setItem('presetsPersiana', JSON.stringify(nuevosPresets));
      setPresets(nuevosPresets);
    } catch (e) {
      console.error('Error al guardar presets:', e);
    }
  };

  const enviarComandoPersiana = (valor: number) => {
    if (client && client.isConnected()) {
      // Enviar comando al tópico de control
      const message = new Paho.Message(String(valor));
      message.destinationName = topics.persianasCommand;
      message.qos = 1;
      client.send(message);      

      // Actualización inmediata de la UI para feedback
      setAperturaPersiana(valor);
      setPersianaAbierta(valor > 0);
      guardarEstado(valor);

      // Solicitar confirmación del estado actual
      setTimeout(() => {
        const statusRequest = new Paho.Message(JSON.stringify({ comando: 'getEstado' }));
        statusRequest.destinationName = TOPICO_PERSIANA;
        client.send(statusRequest);
      }, 500);

    } else if (!isConnected) {
      Alert.alert(
        'Sin conexión',
        'No hay conexión con el controlador de persianas. Intente reconectar.',
        [
          { text: 'Cancelar' },
          { text: 'Reconectar', onPress: () => connectClient() }
        ]
      );
    }
  };

  const abrirCerrarPersiana = () => {
    const nuevoEstado = !persianaAbierta;
    const nuevaPosicion = nuevoEstado ? 100 : 0;
    enviarComandoPersiana(nuevaPosicion);
  };

  const aplicarPreset = (valor: number) => {
    enviarComandoPersiana(valor);
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
          <View style={styles.sensorWidget}>
            <Ionicons name="thermometer-outline" size={24} color="#dc3545" />
            <Text style={styles.sensorValue}>{(temperaturaInterior ?? 0).toFixed(1)}°C</Text>
            <Text style={styles.sensorLabel}>Temp. Interior</Text>
          </View>
          
          <View style={styles.sensorWidget}>
            <Ionicons name="thermometer-outline" size={24} color="#fd7e14" />
            <Text style={styles.sensorValue}>{(temperaturaExterior ?? 0).toFixed(1)}°C</Text>
            <Text style={styles.sensorLabel}>Temp. Exterior</Text>
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
          <View style={styles.ventana}>
            <View style={[styles.persiana, { height: `${100 - aperturaPersiana}%` }]} />
          </View>
          <Text style={styles.aperturaText}>{aperturaPersiana}% abierta</Text>
        </View>

        <View style={styles.controlesContainer}>
          <TouchableOpacity
            style={[styles.botonPrincipal, persianaAbierta ? styles.botonCerrar : styles.botonAbrir]}
            onPress={abrirCerrarPersiana}
          >
            <Ionicons name={persianaAbierta ? "close-outline" : "sunny-outline"} size={28} color="white" />
            <Text style={styles.botonTexto}>
              {persianaAbierta ? "CERRAR PERSIANA" : "ABRIR PERSIANA"}
            </Text>
          </TouchableOpacity>
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
                <Text style={styles.presetValue}>{preset.valor}%</Text>
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
    overflow: 'hidden',
    backgroundColor: '#e9ecef',
  },
  persiana: {
    width: '100%',
    backgroundColor: '#6c757d',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  aperturaText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  controlesContainer: {
    marginBottom: 24,
  },
  botonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  botonAbrir: {
    backgroundColor: '#28a745',
  },
  botonCerrar: {
    backgroundColor: '#dc3545',
  },
  botonTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#343a40',
    marginBottom: 4,
  },
  presetValue: {
    fontSize: 12,
    color: '#6c757d',
  },
});

export default MQTTPersianaControl;