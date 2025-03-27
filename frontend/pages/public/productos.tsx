import React, { useEffect, useState } from 'react';
import { ScrollView, Image, StyleSheet, View, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Animated, Easing, TouchableWithoutFeedback, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles';

const { width } = Dimensions.get('window');

interface Producto {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  discount: number;
  features: string[];
  warranty: string;
  availability: string;
  image: string;
  specs?: {
    material?: string;
    conectividad?: string;
    bateria?: string;
    motorizacion?: string;
    resistencia?: string;
  };
  webUrl?: string; // Nueva propiedad
}

export default function ProductsScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(500))[0];

  const abrirModal = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const cerrarModal = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setProductoSeleccionado(null);
    });
  };

  const adaptarProducto = (producto: any): Producto => {
    return {
      _id: producto._id || producto.id || '',
      title: producto.title || '',
      description: producto.description || '',
      price: producto.price || 0,
      category: producto.category || '',
      brand: producto.brand || '',
      rating: producto.rating || 0,
      reviews: producto.reviews || 0,
      discount: producto.discount || 0,
      features: producto.features || [],
      warranty: producto.warranty || '',
      availability: producto.availability || '',
      image: producto.image || 'https://via.placeholder.com/150',
      specs: producto.specs || {},
      webUrl: producto.webUrl || 'https://www.example.com/products', // URL por defecto
    };
  };

  useEffect(() => {
    setIsLoading(true);
    fetch('http://192.168.1.79:5000/productos')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error de red: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        let productosAdaptados: Producto[] = [];
        if (data && Array.isArray(data)) {
          productosAdaptados = data.map(adaptarProducto);
        } else if (data && data.data && Array.isArray(data.data)) {
          productosAdaptados = data.data.map(adaptarProducto);
        } else if (data && typeof data === 'object') {
          for (const key in data) {
            if (Array.isArray(data[key])) {
              productosAdaptados = data[key].map(adaptarProducto);
              break;
            }
          }
        }

        const categoriasUnicas = Array.from(new Set(productosAdaptados.map(p => p.category)))
          .filter(Boolean)
          .sort();

        setCategorias(categoriasUnicas);
        setProductos(productosAdaptados);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const productosPorCategoria = (categoria: string) => {
    return productos.filter(producto => producto.category === categoria);
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primaryMedium} />
        <ThemedText style={styles.loadingText}>Cargando productos...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={50} color={colors.primaryDark} />
        <ThemedText style={styles.errorText}>Error al cargar productos</ThemedText>
        <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
      </View>
    );
  }

  if (productos.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="cart-outline" size={50} color={colors.primaryLight} />
        <ThemedText style={styles.errorText}>No se encontraron productos</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.mainTitle}>Nuestros Productos</ThemedText>
      </View>

      {categorias.map(categoria => {
        const productosFiltrados = productosPorCategoria(categoria);
        if (productosFiltrados.length === 0) return null;

        return (
          <View key={categoria} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <ThemedText type="subtitle" style={styles.categoryTitle}>{categoria}</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {productosFiltrados.map(producto => (
                <TouchableOpacity key={producto._id} onPress={() => abrirModal(producto)}>
                  <ThemedView style={styles.horizontalProductCard}>
                    <View style={styles.iconCircle}>
                      <Image 
                        source={{ uri: producto.image.startsWith('http') 
                          ? producto.image 
                          : `http://192.168.1.79:5000${producto.image}` }} 
                        style={styles.productImage}
                      />
                    </View>
                    <View style={styles.productInfo}>
                      <ThemedText style={styles.productCategory}>{producto.brand}</ThemedText>
                      <ThemedText style={styles.productTitle}>{producto.title}</ThemedText>
                      <View style={styles.priceRow}>
                        <ThemedText style={styles.productPrice}>${producto.price}</ThemedText>
                      </View>
                    </View>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      })}

      {productoSeleccionado && (
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent
          onRequestClose={cerrarModal}
        >
          <TouchableWithoutFeedback onPress={cerrarModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
                  <TouchableOpacity onPress={cerrarModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.primaryDark} />
                  </TouchableOpacity>
                  <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <Image 
                      source={{ uri: productoSeleccionado.image.startsWith('http') 
                        ? productoSeleccionado.image 
                        : `http://192.168.1.79:5000${productoSeleccionado.image}` }} 
                      style={styles.modalImage}
                    />
                    <ThemedText style={styles.modalTitle}>{productoSeleccionado.title}</ThemedText>
                    <ThemedText style={styles.modalBrand}>{productoSeleccionado.brand}</ThemedText>
                    <ThemedText style={styles.modalPrice}>${productoSeleccionado.price}</ThemedText>
                    <ThemedText style={styles.modalDescription}>{productoSeleccionado.description}</ThemedText>
                    {productoSeleccionado.specs && (
                      <View style={{ marginTop: 10 }}>
                        {productoSeleccionado.specs.material && (
                          <ThemedText style={styles.modalSpecs}>Material: {productoSeleccionado.specs.material}</ThemedText>
                        )}
                        {productoSeleccionado.specs.conectividad && (
                          <ThemedText style={styles.modalSpecs}>Conectividad: {productoSeleccionado.specs.conectividad}</ThemedText>
                        )}
                        {productoSeleccionado.specs.bateria && (
                          <ThemedText style={styles.modalSpecs}>Batería: {productoSeleccionado.specs.bateria}</ThemedText>
                        )}
                        {productoSeleccionado.specs.motorizacion && (
                          <ThemedText style={styles.modalSpecs}>Motorización: {productoSeleccionado.specs.motorizacion}</ThemedText>
                        )}
                        {productoSeleccionado.specs.resistencia && (
                          <ThemedText style={styles.modalSpecs}>Resistencia: {productoSeleccionado.specs.resistencia}</ThemedText>
                        )}
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.webButton}
                      onPress={() => Linking.openURL(productoSeleccionado.webUrl || '')}
                    >
                      <Ionicons name="globe-outline" size={20} color={colors.white} />
                      <ThemedText style={styles.webButtonText}>Ir a Web</ThemedText>
                    </TouchableOpacity>
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.primaryMedium,
    fontFamily: 'Open Sans',
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  errorSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: colors.primaryLight,
    textAlign: 'center',
    fontFamily: 'Open Sans',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryMedium,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
  debugContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.primaryDark,
  },
  debugText: {
    fontSize: 12,
    color: colors.primaryLight,
    fontFamily: 'monospace',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: colors.primaryDark,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBanner: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  promoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    marginBottom: 4,
  },
  promoDescription: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Open Sans',
    marginBottom: 12,
  },
  promoButton: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: colors.primaryMedium,
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Open Sans',
    color: colors.primaryMedium,
  },
  seeAllLink: {
    fontSize: 14,
    fontFamily: 'Open Sans',
    color: colors.accent,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  horizontalProductCard: {
    width: width * 0.38, // Reducido de 0.42 a 0.38
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8, // Reducido de 12 a 8
    marginRight: 8, // Reducido de 12 a 8
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  discountBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconCircle: {
    backgroundColor: 'rgba(65, 90, 119, 0.08)',
    borderRadius: 40, // Reducido de 50 a 40
    width: 70, // Reducido de 80 a 70
    height: 70, // Reducido de 80 a 70
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Reducido de 10 a 8
    alignSelf: 'center',
  },
  productImage: {
    width: 50, // Reducido de 60 a 50
    height: 50, // Reducido de 60 a 50
    resizeMode: 'contain',
  },
  productInfo: {
    alignItems: 'flex-start',
  },
  productCategory: {
    fontSize: 12,
    fontFamily: 'Open Sans',
    color: colors.accent,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 14, // Reducido de 16 a 14
    fontFamily: 'Open Sans',
    color: colors.primaryMedium,
    fontWeight: '600',
    marginBottom: 4, // Reducido de 6 a 4
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  productPrice: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: colors.primaryLight,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    padding: 16, // Reducido de 20 a 16
    borderRadius: 12,
    width: '85%', // Reducido de 90% a 85%
    maxHeight: '75%', // Reducido de 80% a 75%
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modalContent: {
    paddingBottom: 16, // Reducido de 20 a 16
    alignItems: 'center',
    width: '100%', // Asegura que el contenido no se desborde
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalImage: {
    width: 100, // Reducido de 120 a 100
    height: 100, // Reducido de 120 a 100
    resizeMode: 'contain',
    marginBottom: 12, // Reducido de 16 a 12
  },
  modalTitle: {
    fontSize: 20, // Reducido de 22 a 20
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 4, // Reducido de 6 a 4
    textAlign: 'center',
    paddingHorizontal: 10, // Añadido para evitar que el texto toque los bordes
  },
  modalBrand: {
    fontSize: 16,
    color: colors.primaryMedium,
    marginBottom: 6,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 13, // Reducido de 14 a 13
    color: colors.primaryLight,
    textAlign: 'center',
    marginBottom: 8, // Reducido de 10 a 8
    paddingHorizontal: 12, // Añadido para mejor legibilidad
  },
  modalSpecs: {
    fontSize: 13,
    color: colors.primaryMedium,
    textAlign: 'center',
  },
  webButton: {
    backgroundColor: colors.primaryMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    width: '80%',
    alignSelf: 'center',
  },
  webButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 20, // Para compensar el espacio del icono
  },
});