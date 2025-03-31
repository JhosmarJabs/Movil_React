import React, { useEffect, useState } from 'react';
import { ScrollView, Image, StyleSheet, View, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Animated, Easing, TouchableWithoutFeedback, Linking, SafeAreaView, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(500))[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);

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

  useEffect(() => {
    let filtered = productos;
    
    // Aplicar filtro de búsqueda
    if (searchQuery) {
      filtered = filtered.filter(producto =>
        producto.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producto.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producto.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtro de categoría
    if (selectedCategory) {
      filtered = filtered.filter(producto => producto.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, productos]);

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
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.primaryMedium} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.primaryLight}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.primaryMedium} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedCategory && styles.filterChipSelected
              ]}
              onPress={() => setSelectedCategory('')}
            >
              <ThemedText style={[styles.filterText, !selectedCategory && styles.filterTextSelected]}>
                Todos
              </ThemedText>
            </TouchableOpacity>
            {categorias.map(categoria => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.filterChip,
                  selectedCategory === categoria && styles.filterChipSelected
                ]}
                onPress={() => setSelectedCategory(categoria)}
              >
                <ThemedText style={[styles.filterText, selectedCategory === categoria && styles.filterTextSelected]}>
                  {categoria}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <View style={styles.categoriesContainer}>
        {categorias.map(categoria => {
          const productosCategoria = filteredProducts.filter(
            producto => producto.category === categoria
          );
          
          if (productosCategoria.length === 0) return null;

          return (
            <View key={categoria} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <ThemedText style={styles.categoryTitle}>{categoria}</ThemedText>
                <View style={styles.categoryLine} />
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {productosCategoria.map(producto => (
                  <TouchableOpacity 
                    key={producto._id} 
                    onPress={() => abrirModal(producto)} 
                    activeOpacity={0.7}
                    style={styles.cardContainer}
                  >
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
                            : `https://backendd-lidd.onrender.com${producto.image}` }} 
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
                              <View style={styles.modalRatingContainer}>
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
      </View>

      {productoSeleccionado && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalFullScreen}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={cerrarModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.fullScrollView}>
              <View style={styles.modalContent}>
                <View style={styles.modalImageContainer}>
                  <Image 
                    source={{ uri: productoSeleccionado.image.startsWith('http') 
                      ? productoSeleccionado.image 
                      : `https://backendd-lidd.onrender.com${productoSeleccionado.image}` }} 
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
                
                <View style={styles.bottomPadding} />
              </View>
            </ScrollView>
          </View>
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
  productCategory: {
    fontSize: 14,
    color: colors.primaryMedium,
    fontFamily: 'Open Sans',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
    fontFamily: 'Montserrat',
    marginBottom: 4,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 35, // Aumentamos el padding superior
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
    justifyContent: 'flex-start', // Cambiamos a flex-start para mejor control
    alignItems: 'center',
    marginBottom: 10, // Añadimos margen inferior
  },
  mainTitle: {
    fontSize: 24, // Reducimos un poco el tamaño
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: colors.primaryDark,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingRight: 10, // Añadimos padding derecho
    flexShrink: 1, // Permitimos que el texto se encoja si es necesario
  },
  searchContainer: {
    marginTop: 15,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.primaryDark,
    fontFamily: 'Open Sans',
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  filterChipSelected: {
    backgroundColor: colors.primaryMedium,
    borderColor: colors.primaryMedium,
  },
  filterText: {
    color: colors.primaryMedium,
    fontSize: 14,
    fontFamily: 'Open Sans',
  },
  filterTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingTop: 10,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryDark,
    fontFamily: 'Montserrat',
  },
  categoryLine: {
    height: 3,
    width: 40,
    backgroundColor: colors.accent,
    marginTop: 4,
    borderRadius: 2,
  },
  horizontalScroll: {
    paddingLeft: 16,
  },
  cardContainer: {
    width: width * 0.4,
    marginRight: 12,
  },
  horizontalProductCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
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
    borderRadius: 12, // Cambiado a 12 para bordes redondeados suaves
    width: 120,
    height: 100, // Reducido para hacer un rectángulo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(65, 90, 119, 0.15)',
    overflow: 'hidden',
    padding: 10, // Reducido el padding
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Mantenemos 'contain' para preservar la proporción
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  productInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  modalHeader: {
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 8,
  },
  fullScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: 200,     // Aumentado de 160 a 200
    backgroundColor: 'rgba(65, 90, 119, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
    overflow: 'hidden', // Añadido para contener la imagen
  },
  modalImage: {
    width: '80%',    // Cambiado a porcentaje
    height: '80%',   // Cambiado a porcentaje
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 10,
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
    width: '100%',
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryLight,
    textAlign: 'left',
    marginBottom: 16,
    width: '100%',
  },
  specsContainer: {
    backgroundColor: 'rgba(65, 90, 119, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
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
    flex: 1,
  },
  webButton: {
    backgroundColor: colors.primaryMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    width: '90%',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 60,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
    fontFamily: 'Montserrat',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ratingText: {
    fontSize: 12,
    color: colors.primaryMedium,
    fontFamily: 'Open Sans',
    marginLeft: 4,
  },
});