import { useRouter } from 'expo-router'; // Importa useRouter
import React, { useEffect, useState, useRef } from 'react';
import { 
  ScrollView, 
  Image, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  Animated, 
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Easing,
  Linking
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles';
import Router from 'expo-router';

const { width, height } = Dimensions.get('window');

interface Producto {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
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

export default function WelcomeScreen({ navigation }) {
    const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current; // Add slideAnim initialization
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
      toValue: 1000,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setProductoSeleccionado(null);
      setModalVisible(false);
    });
  };
  
  // Animaciones
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200, 300],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const headerScale = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const productsTranslateY = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [30, 0, 0],
    extrapolate: 'clamp',
  });
  
  const productsOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const adaptarProducto = (producto: any): Producto => {
    return {
      _id: producto._id || producto.id || '',
      title: producto.title || '',
      description: producto.description || '',
      price: producto.price || 0,
      category: producto.category || '',
      brand: producto.brand || '',
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

        // Filtrar solo productos de la categoría "seguridad"
        const productosSeguridad = productosAdaptados.filter(p => 
          p.category.toLowerCase() === 'seguridad');
        
        setProductos(productosSeguridad);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primaryMedium} />
        <ThemedText style={styles.loadingText}>Preparando tu experiencia...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={50} color={colors.primaryDark} />
        <ThemedText style={styles.errorText}>Error al cargar</ThemedText>
        <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Sección de Bienvenida */}
        <Animated.View 
          style={[
            styles.welcomeSection, 
            { 
              opacity: headerOpacity,
              transform: [
                { translateY: headerTranslateY },
                { scale: headerScale }
              ] 
            }
          ]}
        >
          <ImageBackground
            source={require('../assets/fonts/fondo.jpeg')} // Imagen simple de fondo (casa inteligente)
            style={styles.welcomeBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            >
              <View style={styles.welcomeContent}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/images/logo.jpeg')} // Logo simple 
                    style={styles.logo}
                    resizeMode="cover"
                  />
                </View>
                
                <View style={styles.welcomeTextContainer}>
                <ThemedText style={styles.welcomeTitle}>Bienvenido a JADA</ThemedText>
                  <ThemedText style={styles.welcomeSubtitle}>
                    Tecnología inteligente para tu hogar
                  </ThemedText>
                  <ThemedText style={styles.welcomeDescription}>
                    Conecta, controla y asegura tu espacio con nuestras soluciones inteligentes
                  </ThemedText>
                </View>
                
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => router.push('/login')}
                  >
                    <Ionicons name="log-in-outline" size={18} color={colors.white} />
                    <ThemedText style={styles.primaryButtonText}>Iniciar Sesión</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => router.push('/registro')}
                  >
                    <Ionicons name="person-add-outline" size={18} color={colors.white} />
                    <ThemedText style={styles.secondaryButtonText}>Crear Cuenta</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.scrollIndicator}>
                  <ThemedText style={styles.scrollText}>Descubre Productos de Seguridad</ThemedText>
                  <Ionicons name="chevron-down" size={24} color={colors.white} />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* Sección de Productos */}
        <Animated.View 
          style={[
            styles.productsSection, 
            { 
              opacity: productsOpacity,
              transform: [{ translateY: productsTranslateY }] 
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primaryDark} />
              <ThemedText style={styles.sectionTitle}>Seguridad Inteligente</ThemedText>
            </View>
            <ThemedText style={styles.sectionSubtitle}>
              Protege tu hogar con tecnología avanzada
            </ThemedText>
          </View>

          {/* Destacado del producto principal */}
          {productos.length > 0 && (
            <View style={styles.featuredProductContainer}>
              <Image 
                source={{ uri: productos[0].image.startsWith('http') 
                  ? productos[0].image 
                  : `https://backendd-lidd.onrender.com${productos[0].image}` }} 
                style={styles.featuredProductImage}
                resizeMode="contain"
              />
              <View style={styles.featuredProductInfo}>
                <ThemedText style={styles.featuredProductCategory}>{productos[0].category}</ThemedText>
                <ThemedText style={styles.featuredProductTitle}>{productos[0].title}</ThemedText>
                <ThemedText style={styles.featuredProductBrand}>{productos[0].brand}</ThemedText>
                <ThemedText style={styles.featuredProductPrice}>${productos[0].price}</ThemedText>
              </View>
            </View>
          )}

          {/* Grid de productos */}
          <View style={styles.productsGrid}>
            {productos.length > 1 ? (
              productos.slice(1).map(producto => (
                <TouchableOpacity 
                  key={producto._id} 
                  style={styles.productCard}
                  onPress={() => abrirModal(producto)}
                >
                  <View style={styles.productImageContainer}>
                    <Image 
                      source={{ uri: producto.image.startsWith('http') 
                        ? producto.image 
                        : `https://backendd-lidd.onrender.com${producto.image}` }} 
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.productCardContent}>
                    <ThemedText style={styles.productBrand}>{producto.brand}</ThemedText>
                    <ThemedText style={styles.productTitle} numberOfLines={2}>{producto.title}</ThemedText>
                    <ThemedText style={styles.productPrice}>${producto.price}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noProductsContainer}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.primaryLight} />
                <ThemedText style={styles.noProductsText}>
                  No hay productos adicionales disponibles
                </ThemedText>
              </View>
            )}
          </View>

          {/* Redes sociales */}
          <View style={styles.socialSection}>
            <ThemedText style={styles.socialText}>
              Síguenos en nuestras redes
            </ThemedText>
            <View style={styles.socialIcons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color={colors.primaryMedium} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-instagram" size={24} color={colors.primaryMedium} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-twitter" size={24} color={colors.primaryMedium} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Sección de beneficios */}
          <View style={styles.benefitsSection}>
            <ThemedText style={styles.benefitsSectionTitle}>
              ¿Por qué elegir JADA?
            </ThemedText>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="flash-outline" size={24} color={colors.primaryMedium} />
              </View>
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>Fácil instalación</ThemedText>
                <ThemedText style={styles.benefitDescription}>
                  Productos diseñados para una configuración rápida y sencilla
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.primaryMedium} />
              </View>
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>Control móvil</ThemedText>
                <ThemedText style={styles.benefitDescription}>
                  Gestiona tu hogar desde cualquier lugar a través de nuestra app
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="shield-outline" size={24} color={colors.primaryMedium} />
              </View>
              <View style={styles.benefitContent}>
                <ThemedText style={styles.benefitTitle}>Seguridad avanzada</ThemedText>
                <ThemedText style={styles.benefitDescription}>
                  Protección 24/7 con alertas en tiempo real
                </ThemedText>
              </View>
            </View>
          </View>
          
          {/* Footer con botones finales */}
          <View style={styles.footerContainer}>
            <TouchableOpacity 
              style={styles.footerButton}
              onPress={() => navigation.navigate('Login')}
            >
              <ThemedText style={styles.footerButtonText}>Iniciar Sesión</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.footerDivider} />
            
            <TouchableOpacity style={styles.footerButton}>
              <ThemedText style={styles.footerButtonText}>Contacto</ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Modal para detalles de producto */}
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
                        : `https://backendd-lidd.onrender.com${productoSeleccionado.image}` }} 
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
                      onPress={() => Linking.openURL(productoSeleccionado.webUrl || 'https://www.example.com/products')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    height: height * 0.85, // 85% de la altura de la pantalla
    position: 'relative',
  },
  welcomeBackground: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,  // Añadir padding horizontal
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 26, // Reducir de 32 o 30 a 26
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 10,
    marginHorizontal: 20, // Aumentar el margen horizontal
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 20,
    color: colors.white,
    marginBottom: 15,
    fontFamily: 'Open Sans',
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'Open Sans',
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.primaryMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.white,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
  scrollIndicator: {
    alignItems: 'center',
  },
  scrollText: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Open Sans',
  },
  productsSection: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
  },
  sectionHeader: {
    marginBottom: 25,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.primaryLight,
    fontFamily: 'Open Sans',
    paddingLeft: 32, // Alineado con el título
  },
  featuredProductContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredProductImage: {
    width: 120,
    height: 120,
    marginRight: 15,
  },
  featuredProductInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  featuredProductCategory: {
    fontSize: 12,
    color: colors.primaryMedium,
    marginBottom: 5,
    fontFamily: 'Open Sans',
  },
  featuredProductTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 5,
    fontFamily: 'Montserrat',
  },
  featuredProductBrand: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 8,
    fontFamily: 'Open Sans',
  },
  featuredProductPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 10,
    fontFamily: 'Montserrat',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImageContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  productCardContent: {
    paddingHorizontal: 5,
  },
  productBrand: {
    fontSize: 12,
    color: colors.accent,
    marginBottom: 2,
    fontFamily: 'Open Sans',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryMedium,
    marginBottom: 5,
    fontFamily: 'Open Sans',
    height: 36, // Altura fija para 2 líneas
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
    fontFamily: 'Montserrat',
  },
  socialSection: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 30,
  },
  socialText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 15,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(65, 90, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    width: '85%',
    maxHeight: '75%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modalContent: {
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
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
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 13,
    color: colors.primaryLight,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
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
    marginRight: 20,
  },
  benefitsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  benefitsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 15,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(65, 90, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 2,
    fontFamily: 'Open Sans',
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.primaryLight,
    fontFamily: 'Open Sans',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  footerButtonText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontFamily: 'Open Sans',
    fontWeight: '600',
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
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
  noProductsContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  noProductsText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.primaryLight,
    textAlign: 'center',
    fontFamily: 'Open Sans',
  },
});