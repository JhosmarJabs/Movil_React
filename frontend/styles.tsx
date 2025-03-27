export const colors = {
    primaryDark: "#0D1B2A",  // Azul Oscuro
    primaryMedium: "#1B263B", // Azul Medio
    primaryLight: "#415A77", // Azul Claro
    accent: "#778A9A", // Azul Pastel
    white: "#E0E1DD", // Blanco
    black: "#000000", // Negro
};

export const typography = {
    fontPrimary: "'Montserrat', sans-serif", // Para títulos y encabezados
    fontSecondary: "'Open Sans', sans-serif", // Para textos largos y párrafos
};

export const layout = {
    container: {
        width: "90%",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    sectionPadding: {
        padding: "50px 20px",
    },
};

export const buttons = {
    primary: {
        backgroundColor: colors.primaryDark,
        color: colors.white,
        padding: "10px 20px",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
        fontFamily: typography.fontPrimary,
        fontSize: "16px",
        fontWeight: "bold",
    },
    secondary: {
        backgroundColor: colors.primaryMedium,
        color: colors.white,
        padding: "8px 16px",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
        fontFamily: typography.fontSecondary,
        fontSize: "14px",
    },
};

export const textStyles = {
    title: {
        fontSize: "32px",
        fontWeight: "bold",
        fontFamily: typography.fontPrimary,
        color: colors.primaryDark,
    },
    subtitle: {
        fontSize: "24px",
        fontWeight: "600",
        fontFamily: typography.fontSecondary,
        color: colors.primaryMedium,
    },
    paragraph: {
        fontSize: "16px",
        fontFamily: typography.fontSecondary,
        color: colors.primaryLight,
        lineHeight: "1.5",
    },
};

// Estilos para el componente Configuracion (IoT)
export const iotStyles = {
    deviceCard: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }
    },
    sensorCard: {
        padding: '1rem',
        backgroundColor: 'rgba(65, 90, 119, 0.15)', // Usando primaryLight con transparencia
        borderRadius: '0.25rem',
        textAlign: 'center'
    },
    iconCircle: {
        padding: '1rem',
        backgroundColor: colors.white,
        borderRadius: '50%',
        display: 'inline-block'
    },
    verticalSlider: {
        height: '150px',
        writingMode: 'bt-lr',
        WebkitAppearance: 'slider-vertical'
    },
    addDeviceContainer: {
        textAlign: 'center',
        padding: '3rem 0'
    },
    addDeviceIcon: {
        fontSize: '3rem',
        color: colors.primaryDark
    },
    addDeviceContainerAlt: {
        textAlign: "center",
        padding: "20px",
    }, 
};