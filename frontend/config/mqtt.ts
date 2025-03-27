import { Buffer } from 'buffer';
global.Buffer = Buffer;

export const MQTT_CONFIG = {
  host: '192.168.1.72',
  port: 9001,  // Cambiado a puerto WebSocket estándar para MQTT
  path: '/mqtt', 
  topic: 'sensores/led',
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  connectOptions: {
    timeout: 3,
    keepAliveInterval: 60,
    cleanSession: true,
    useSSL: false,
    reconnect: true,
    mqttVersion: 3,  // Cambiado a versión 3
    hosts: ['192.168.1.72'],
    ports: [9001]
  }
};
