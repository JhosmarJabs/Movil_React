import React, { useEffect, useState } from 'react';
import { ScrollView, Image, StyleSheet, View, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Animated, Easing, TouchableWithoutFeedback, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Interface remains the same
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
  webUrl?: string;
}

export default function ProductsScreen() {
  // State management remains the same
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
      webUrl: producto.webUrl || 'https://www.example.com/products',
    };
  };

  useEffect(() => {
    setIsLoading(true);
    fetch('https://backendd-lidd.onrender.com/productos')
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

  // Render functions with enhanced styling

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
      <LinearGradient
        colors={[colors.primaryLight, colors.white]}
        start={[0, 0]}
        end={[0, 0.2]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.mainTitle}>Nuestros Productos</ThemedText>
        </View>
      </LinearGradient>

      {categorias.map(categoria => {
        const productosFiltrados = productosPorCategoria(categoria);
        if (productosFiltrados.length === 0) return null;

        return (
          <View key={categoria} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <ThemedText type="subtitle" style={styles.categoryTitle}>{categoria}</ThemedText>
              <View style={styles.categoryLine}></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {productosFiltrados.map(producto => (
                <TouchableOpacity key={producto._id} onPress={() => abrirModal(producto)} activeOpacity={0.7}>
                  <ThemedView style={styles.horizontalProductCard}>
                    {producto.discount > 0 && (
                      <View style={styles.badgeContainer}>
                        <View style={styles.discountBadge}>
                          <ThemedText style={styles.discountText}>{producto.discount}% OFF</ThemedText>
                        </View>
                      </View>
                    )}
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
                      <ThemedText style={styles.productTitle} numberOfLines={1} ellipsizeMode="tail">{producto.title}</ThemedText>
                      <View style={styles.priceRow}>
                        <View style={styles.priceContainer}>
                          <ThemedText style={styles.productPrice}>${producto.price}</ThemedText>
                          {producto.rating > 0 && (
                            <View style={styles.ratingContainer}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <ThemedText style={styles.ratingText}>{producto.rating}</ThemedText>
                            </View>
                          )}
                        </View>
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
                  
                  {/* Improved ScrollView with contentContainerStyle to ensure content is properly laid out */}
                  <ScrollView 
                    contentContainerStyle={styles.modalContent} 
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScrollView}
                  >
                    <View style={styles.modalImageContainer}>
                      <Image 
                        source={{ uri: productoSeleccionado.image.startsWith('http') 
                          ? productoSeleccionado.image 
                          : `http://192.168.1.79:5000${productoSeleccionado.image}` }} 
                        style={styles.modalImage}
                      />
                    </View>
                    <ThemedText style={styles.modalTitle}>{productoSeleccionado.title}</ThemedText>
                    <ThemedText style={styles.modalBrand}>{productoSeleccionado.brand}</ThemedText>
                    
                    {productoSeleccionado.rating > 0 && (
                      <View style={styles.modalRatingContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons 
                            key={star}
                            name={star <= productoSeleccionado.rating ? "star" : "star-outline"} 
                            size={16} 
                            color="#FFD700" 
                            style={{marginHorizontal: 2}}
                          />
                        ))}
                        <ThemedText style={styles.modalReviews}>({productoSeleccionado.reviews})</ThemedText>
                      </View>
                    )}
                    
                    <ThemedText style={styles.modalPrice}>${productoSeleccionado.price}</ThemedText>
                    
                    <View style={styles.separator} />
                    
                    <ThemedText style={styles.modalDescription}>{productoSeleccionado.description}</ThemedText>
                    
                    {productoSeleccionado.specs && Object.keys(productoSeleccionado.specs).length > 0 && (
                      <View style={styles.specsContainer}>
                        <ThemedText style={styles.specsTitle}>Especificaciones</ThemedText>
                        {productoSeleccionado.specs.material && (
                          <View style={styles.specRow}>
                            <Ionicons name="hardware-chip-outline" size={16} color={colors.primaryMedium} />
                            <ThemedText style={styles.modalSpecs}>Material: {productoSeleccionado.specs.material}</ThemedText>
                          </View>
                        )}
                        {productoSeleccionado.specs.conectividad && (
                          <View style={styles.specRow}>
                            <Ionicons name="wifi-outline" size={16} color={colors.primaryMedium} />
                            <ThemedText style={styles.modalSpecs}>Conectividad: {productoSeleccionado.specs.conectividad}</ThemedText>
                          </View>
                        )}
                        {productoSeleccionado.specs.bateria && (
                          <View style={styles.specRow}>
                            <Ionicons name="battery-charging-outline" size={16} color={colors.primaryMedium} />
                            <ThemedText style={styles.modalSpecs}>Batería: {productoSeleccionado.specs.bateria}</ThemedText>
                          </View>
                        )}
                        {productoSeleccionado.specs.motorizacion && (
                          <View style={styles.specRow}>
                            <Ionicons name="car-outline" size={16} color={colors.primaryMedium} />
                            <ThemedText style={styles.modalSpecs}>Motorización: {productoSeleccionado.specs.motorizacion}</ThemedText>
                          </View>
                        )}
                        {productoSeleccionado.specs.resistencia && (
                          <View style={styles.specRow}>
                            <Ionicons name="shield-outline" size={16} color={colors.primaryMedium} />
                            <ThemedText style={styles.modalSpecs}>Resistencia: {productoSeleccionado.specs.resistencia}</ThemedText>
                          </View>
                        )}
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.webButton}
                      onPress={() => Linking.openURL(productoSeleccionado.webUrl || '')}
                    >
                      <Ionicons name="globe-outline" size={20} color={colors.white} />
                      <ThemedText style={styles.buttonText}>Ver en Web</ThemedText>
                    </TouchableOpacity>
                    
                    {/* Added extra padding at the bottom to ensure better scrolling */}
                    <View style={styles.bottomPadding} />
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
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 15,
    marginBottom: 10,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: colors.primaryDark,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoryContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Open Sans',
    color: colors.primaryMedium,
  },
  categoryLine: {
    height: 3,
    width: 40,
    backgroundColor: colors.accent,
    marginTop: 4,
    borderRadius: 2,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  horizontalProductCard: {
    width: width * 0.38,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  discountBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconCircle: {
    backgroundColor: 'rgba(65, 90, 119, 0.08)',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(65, 90, 119, 0.15)',
  },
  productImage: {
    width: 60,
    height: 60,
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
    fontWeight: '500',
  },
  productTitle: {
    fontSize: 14,
    fontFamily: 'Open Sans',
    color: colors.primaryMedium,
    fontWeight: '600',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Changed from space-between to center
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'center', // Center the price and rating
  },
  productPrice: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    justifyContent: 'center', // Center the star and rating
  },
  ratingText: {
    fontSize: 12,
    color: colors.primaryMedium,
    marginLeft: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    marginTop: 'auto',
    marginBottom: 'auto',
    overflow: 'hidden',
  },
  modalScrollView: {
    width: '100%',
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20, // Added more padding at bottom
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(65, 90, 119, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalBrand: {
    fontSize: 16,
    color: colors.primaryMedium,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalReviews: {
    fontSize: 14,
    color: colors.primaryLight,
    marginLeft: 5,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
    width: '90%',
    alignSelf: 'center',
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryLight,
    textAlign: 'left',
    marginBottom: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  specsContainer: {
    backgroundColor: 'rgba(65, 90, 119, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20, // Increased margin bottom
    width: '90%', // Make sure it's properly sized
    alignSelf: 'center',
  },
  specsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryMedium,
    marginBottom: 10,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSpecs: {
    fontSize: 14,
    color: colors.primaryMedium,
    marginLeft: 8,
    flex: 1, // Allow text to wrap if needed
  },
  webButton: {
    backgroundColor: colors.primaryMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    width: '90%', // Make the button a bit narrower
    marginTop: 5, // Added some top margin
    marginBottom: 20, // Ensure space below the button
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20, // Extra padding at the bottom to ensure content is fully scrollable
  }
});