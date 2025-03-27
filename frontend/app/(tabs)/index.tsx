import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, StatusBar } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MQTT_CONFIG } from '../../config/mqtt';
import Paho from 'paho-mqtt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MQTTPersianaControl = () => {
  const [persianaAbierta, setPersianaAbierta] = useState(false);
  const [aperturaPersiana, setAperturaPersiana] = useState(0);
  const [client, setClient] = useState<Paho.Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState([
    { nombre: 'Mañana', valor: 75 },
    { nombre: 'Tarde', valor: 50 },
    { nombre: 'Noche', valor: 0 },
  ]);

  const TOPICO_PERSIANA = 'sensores/servo/control';
  const TOPICO_ESTADO = 'sensores/servo/estado';

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
        console.log('Conexión MQTT perdida:', responseObject.errorMessage);
        setIsConnected(false);
        setTimeout(connectClient, 5000);
      };

      mqttClient.onMessageArrived = (message) => {
        console.log('Mensaje recibido:', message.destinationName, message.payloadString);

        if (message.destinationName === TOPICO_ESTADO) {
          try {
            const estadoRecibido = JSON.parse(message.payloadString);
            if (estadoRecibido.apertura !== undefined) {
              setAperturaPersiana(estadoRecibido.apertura);
              setPersianaAbierta(estadoRecibido.apertura > 0);
              guardarEstado(estadoRecibido.apertura);
            }
          } catch (e) {
            console.error('Error al procesar mensaje:', e);
          }
        }
          // 🆕 Agrega esto justo después
        if (message.destinationName === 'sensores/servo/position') {
          const valor = parseInt(message.payloadString);
          if (!isNaN(valor)) {
            setAperturaPersiana(valor);
            setPersianaAbierta(valor > 0);
            guardarEstado(valor);
          }
        }
      };

      const connectOptions = {
        timeout: 3,
        keepAliveInterval: 60,
        cleanSession: true,
        useSSL: false,
        onSuccess: () => {
          console.log('Conexión MQTT exitosa');
          setIsConnected(true);

          const topicos = [TOPICO_ESTADO, 'sensores/servo/+', 'sensores/servo/position'];
          topicos.forEach((topico) => {
            mqttClient.subscribe(topico);
            console.log(`Suscrito al tópico: ${topico}`);
          });

          const mensajeEstado = new Paho.Message(JSON.stringify({ comando: 'getEstado' }));
          mensajeEstado.destinationName = TOPICO_PERSIANA;
          mqttClient.send(mensajeEstado);

          setClient(mqttClient);
        },
        onFailure: (err: Paho.MQTTError) => {
          console.error('Error de conexión MQTT:', err);
          Alert.alert(
            'Error de conexión',
            'No se pudo conectar al sistema de persianas. ¿Está encendido el controlador?',
            [
              { text: 'Reintentar', onPress: () => setTimeout(connectClient, 3000) },
              { text: 'Continuar sin conexión' }
            ]
          );
          setIsConnected(false);
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
      const message = new Paho.Message(String(valor)); // ⚠️ valor debe estar entre 0 y 180
      message.destinationName = 'sensores/servo/set';
      message.qos = 1;
      client.send(message);      

      console.log(`Comando enviado: apertura ${valor}%`);
      setAperturaPersiana(valor);
      setPersianaAbierta(valor > 0);
      guardarEstado(valor);
    } else if (!isConnected) {
      Alert.alert('Sin conexión', 'No hay conexión con el controlador de persianas.');
    }
  };

  const abrirCerrarPersiana = () => {
    const nuevoEstado = !persianaAbierta;
    const nuevaPosicion = nuevoEstado ? 100 : 0;
    enviarComandoPersiana(nuevaPosicion);
  };

  const actualizarApertura = (valor: number) => {
    setAperturaPersiana(valor);
  };

  const aplicarApertura = (valor: number) => {
    if (client && client.isConnected()) {
      const message = new Paho.Message(String(valor));
      message.destinationName = 'sensores/servo/set'; // Tópico corregido
      message.qos = 1;
      client.send(message);

      console.log(`Comando enviado al tópico sensores/servo/set: ${valor}`);
    } else if (!isConnected) {
      Alert.alert('Sin conexión', 'No hay conexión con el controlador.');
    }
  };

  const aplicarPreset = (valor: number) => {
    enviarComandoPersiana(valor);
  };

  const guardarComoPreset = () => {
    Alert.prompt(
      'Guardar posición',
      'Introduce un nombre para esta posición:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: (nombre) => {
            if (nombre) {
              const nuevoPreset = { nombre, valor: aperturaPersiana };
              const nuevosPresets = [...presets, nuevoPreset];
              guardarPresets(nuevosPresets);
              Alert.alert('Éxito', `Posición "${nombre}" guardada correctamente.`);
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
        <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.connectionText}>{isConnected ? 'Conectado' : 'Desconectado'}</Text>
        </View>
      </View>

      <View style={styles.container}>
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

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Ajustar apertura</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={aperturaPersiana}
              onValueChange={actualizarApertura}
              onSlidingComplete={aplicarApertura}
              minimumTrackTintColor="#007bff"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#007bff"
            />
            <View style={styles.sliderLabels}>
              <Text>0%</Text>
              <Text>50%</Text>
              <Text>100%</Text>
            </View>
          </View>
        </View>

        <View style={styles.presetsContainer}>
          <Text style={styles.presetsTitle}>Presets rápidos:</Text>
          <View style={styles.presetButtons}>
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

            <TouchableOpacity
              style={[styles.presetButton, styles.addPresetButton]}
              onPress={guardarComoPreset}
            >
              <Ionicons name="add-circle-outline" size={24} color="#007bff" />
              <Text style={[styles.presetName, { color: '#007bff' }]}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  persianaVisualizacion: {
    alignItems: 'center',
    marginBottom: 24,
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
  sliderContainer: {
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#495057',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: -4,
  },
  presetsContainer: {
    marginTop: 8,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#495057',
  },
  presetButtons: {
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
  addPresetButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#007bff',
    backgroundColor: 'transparent',
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