import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Linking, 
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

// Componente principal de la pantalla de contacto
const ContactoScreen = () => {
  // Estado del formulario
  const [formState, setFormState] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState(false);

  // Función para manejar cambios en los inputs
  const handleInputChange = (field, value) => {
    setFormState({
      ...formState,
      [field]: value
    });
  };

  // Función para enviar el formulario de contacto
  const enviarContacto = async (contacto) => {
    try {
      const response = await fetch('https://backendd-lidd.onrender.com/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contacto)
      });
      return response.ok;
    } catch (error) {
      console.error('Error al enviar el contacto:', error);
      return false;
    }
  };

  // Validación y envío del formulario
  const handleSubmit = async () => {
    if (formState.nombre && formState.email && formState.mensaje) {
      setIsSubmitting(true);
      const exito = await enviarContacto(formState);
      setIsSubmitting(false);
      
      if (exito) {
        setFormSubmitted(true);
        setFormError(false);
        setFormState({
          nombre: '',
          email: '',
          telefono: '',
          mensaje: ''
        });
        
        // Mostrar alerta de éxito
        Alert.alert(
          "¡Mensaje Enviado!",
          "Gracias por contactarnos. Nos pondremos en contacto contigo a la brevedad."
        );
      } else {
        setFormError(true);
        Alert.alert(
          "Error en el envío",
          "Hubo un problema al enviar tu mensaje. Por favor intenta nuevamente más tarde."
        );
      }
    } else {
      setFormError(true);
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos (nombre, email y mensaje)."
      );
    }
  };

  // Función para abrir enlaces
  const openLink = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("No se puede abrir la URL: " + url);
      }
    });
  };

  // Función para realizar llamadas
  const callNumber = (phone) => {
    const phoneNumber = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.openURL(phoneNumber);
  };

  // Función para enviar emails
  const sendEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Información de contacto
  const contactInfo = [
    {
      icon: "location-outline",
      title: "Dirección",
      content: "Calle Principal #123, Huejutla de Reyes, Hidalgo, México",
      action: () => openLink("https://maps.app.goo.gl/UzrK1BW2QVNirmmt8"),
      actionText: "Ver en Google Maps"
    },
    {
      icon: "call-outline",
      title: "Teléfono",
      content: "+52 123 456 7890 (Oficina)\n+52 987 654 3210 (Atención)",
      action: () => callNumber("+521234567890"),
      actionText: "Llamar ahora"
    },
    {
      icon: "mail-outline",
      title: "Correo Electrónico",
      content: "info@jadacompany.com\nventas@jadacompany.com",
      action: () => sendEmail("info@jadacompany.com"),
      actionText: "Enviar email"
    },
    {
      icon: "time-outline",
      title: "Horario de Atención",
      content: "Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 10:00 AM - 2:00 PM\nDomingos y Festivos: Cerrado"
    }
  ];

  // Redes sociales
  const socialNetworks = [
    {
      icon: "logo-facebook",
      name: "Facebook",
      handle: "JADA Company",
      url: "https://facebook.com/jadacompany"
    },
    {
      icon: "logo-instagram",
      name: "Instagram",
      handle: "@JADACompany",
      url: "https://instagram.com/jadacompany"
    },
    {
      icon: "logo-linkedin",
      name: "LinkedIn",
      handle: "JADA Company",
      url: "https://linkedin.com/company/jadacompany"
    }
  ];

  // Preguntas frecuentes
  const faqs = [
    {
      question: "¿Cuánto tiempo tarda la respuesta a mis consultas?",
      answer: "Nos comprometemos a responder todas las consultas en un plazo máximo de 24 horas hábiles."
    },
    {
      question: "¿Ofrecen servicios de consultoría personalizada?",
      answer: "Sí, contamos con un equipo de especialistas que pueden brindar asesoría personalizada para tu proyecto o negocio."
    },
    {
      question: "¿Realizan envíos a nivel nacional?",
      answer: "Sí, realizamos envíos a toda la República Mexicana. Los tiempos de entrega varían según la ubicación."
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header/Hero con imagen de fondo */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>Contacto</Text>
            <Text style={styles.heroSubtitle}>
              Estamos aquí para escucharte. Contáctanos y descubre cómo JADA Company puede impulsar tus proyectos.
            </Text>
          </View>

          {/* Sección de información de contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>
            
            {contactInfo.map((info, index) => (
              <View key={index} style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name={info.icon as any} size={24} color="#415A77" style={styles.infoIcon} />
                  <Text style={styles.infoTitle}>{info.title}</Text>
                </View>
                <Text style={styles.infoContent}>{info.content}</Text>
                {info.action && (
                  <TouchableOpacity onPress={info.action} style={styles.infoButton}>
                    <Text style={styles.infoButtonText}>{info.actionText}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#415A77" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Sección de formulario de contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Envíanos un Mensaje</Text>
            
            {formError && (
              <View style={styles.errorAlert}>
                <Text style={styles.errorTitle}>Error en el formulario</Text>
                <Text style={styles.errorText}>
                  Por favor completa todos los campos requeridos (nombre, email y mensaje).
                </Text>
              </View>
            )}
            
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  value={formState.nombre}
                  onChangeText={(text) => handleInputChange('nombre', text)}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Correo Electrónico*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formState.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+52 123 456 7890"
                  keyboardType="phone-pad"
                  value={formState.telefono}
                  onChangeText={(text) => handleInputChange('telefono', text)}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mensaje*</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="¿En qué podemos ayudarte?"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={formState.mensaje}
                  onChangeText={(text) => handleInputChange('mensaje', text)}
                />
              </View>
              
              <Text style={styles.requiredText}>* Campos requeridos</Text>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar Mensaje</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Redes Sociales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Síguenos en Redes</Text>
            <Text style={styles.sectionText}>
              Mantente al día con nuestras novedades, promociones y proyectos siguiéndonos en nuestras redes sociales:
            </Text>
            
            {socialNetworks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialLink}
                onPress={() => openLink(social.url)}
              >
                <Ionicons name={social.icon as any} size={28} color="#415A77" style={styles.socialIcon} />
                <View>
                  <Text style={styles.socialName}>{social.name}</Text>
                  <Text style={styles.socialHandle}>{social.handle}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <View style={styles.attentionCard}>
              <Text style={styles.attentionTitle}>Atención Personalizada</Text>
              <Text style={styles.attentionText}>
                Para proyectos especiales o consultas específicas, nuestro equipo de especialistas está disponible para brindarte una atención personalizada.
              </Text>
              <Text style={styles.attentionSubtitle}>
                Agenda una reunión virtual o presencial:
              </Text>
              <TouchableOpacity 
                style={styles.attentionButton}
                onPress={() => sendEmail("reuniones@jadacompany.com")}
              >
                <Text style={styles.attentionButtonText}>reuniones@jadacompany.com</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mapa */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encuéntranos</Text>
            <Text style={styles.sectionText}>
              Visítanos en nuestra sede principal en Huejutla de Reyes, Hidalgo. Estamos ubicados en una zona céntrica de fácil acceso.
            </Text>
            
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: 21.143550,
                  longitude: -98.407213,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: 21.143550, longitude: -98.407213 }}
                  title="JADA Company"
                  description="Oficinas principales"
                />
              </MapView>
            </View>
          </View>

          {/* Preguntas Frecuentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
            
            {faqs.map((faq, index) => (
              <View 
                key={index} 
                style={[
                  styles.faqItem, 
                  index % 2 === 0 ? styles.faqItemEven : styles.faqItemOdd
                ]}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </View>

          {/* CTA Section */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaTitle}>¿Listo para comenzar?</Text>
            <Text style={styles.ctaText}>
              Nuestro equipo está listo para ayudarte a llevar tu proyecto al siguiente nivel.
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => handleSubmit()}
            >
              <Text style={styles.ctaButtonText}>Contáctanos Ahora</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Estilos de la pantalla
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Hero Section
  heroContainer: {
    backgroundColor: '#0D1B2A',
    padding: 30,
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  // Section Styles
  section: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#415A77',
    width: 180,
  },
  sectionText: {
    fontSize: 16,
    color: '#415A77',
    marginBottom: 20,
    lineHeight: 24,
  },
  // Info Cards
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#415A77',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  infoContent: {
    fontSize: 15,
    color: '#415A77',
    lineHeight: 22,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#415A77',
    marginRight: 6,
  },
  // Form Styles
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0D1B2A',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  requiredText: {
    fontSize: 14,
    color: '#415A77',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Error Alert
  errorAlert: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#0D1B2A',
  },
  // Social Media
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  socialIcon: {
    marginRight: 16,
  },
  socialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  socialHandle: {
    fontSize: 14,
    color: '#415A77',
  },
  // Attention Card
  attentionCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attentionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 10,
  },
  attentionText: {
    fontSize: 15,
    color: '#415A77',
    lineHeight: 22,
    marginBottom: 16,
  },
  attentionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 10,
  },
  attentionButton: {
    backgroundColor: 'rgba(65, 90, 119, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  attentionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  // Map Styles
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // FAQ Styles
  faqItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  faqItemEven: {
    backgroundColor: '#F8F9FA',
  },
  faqItemOdd: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 15,
    color: '#415A77',
    lineHeight: 22,
  },
  // CTA Styles
  ctaContainer: {
    backgroundColor: '#415A77',
    padding: 30,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
});

export default ContactoScreen;