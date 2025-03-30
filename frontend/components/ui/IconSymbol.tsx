// This file is a fallback for using MaterialIcons on Android and web.

import { Ionicons } from '@expo/vector-icons';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  // Mapa de conversión de nombres de iconos
  const iconMap: { [key: string]: string } = {
    'house.fill': 'home',
    'paperplane.fill': 'search'
  };

  // Convertir el nombre del icono si existe en el mapa
  const ionIconName = iconMap[name] || name;

  return (
    <Ionicons
      name={ionIconName as any}
      size={size}
      color={color}
      style={style}
    />
  );
}
