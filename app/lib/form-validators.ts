/**
 * Form Validators - Funciones reutilizables para validación de formularios
 */

export const validators = {
  /**
   * Valida que el email sea válido
   */
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Valida que el nombre no esté vacío y tenga mínimo 2 caracteres
   */
  nombre: (value: string): boolean => {
    return value.trim().length >= 2;
  },

  /**
   * Valida que el campo no esté vacío
   */
  required: (value: string): boolean => {
    return value.trim().length > 0;
  },

  /**
   * Valida que el monto sea un número válido
   */
  monto: (value: string): boolean => {
    const numero = parseFloat(value);
    return !isNaN(numero) && numero > 0;
  },

  /**
   * Valida que el monto sea mayor o igual al mínimo
   */
  montoMinimo: (value: string, minimo: number = 10000): boolean => {
    const numero = parseFloat(value);
    return !isNaN(numero) && numero >= minimo;
  },

  /**
   * Valida que el monto esté en rango
   */
  montoRango: (value: string, minimo: number = 10000, maximo: number = 1000000): boolean => {
    const numero = parseFloat(value);
    return !isNaN(numero) && numero >= minimo && numero <= maximo;
  },

  /**
   * Valida que el teléfono tenga formato válido (básico)
   */
  telefono: (value: string): boolean => {
    const telefonoRegex = /^[0-9\s\-\+\(\)]{10,}$/;
    return telefonoRegex.test(value.replace(/\s/g, ''));
  },
};

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valida un formulario de inversión de capital
 */
export const validateCapitalForm = (data: {
  name: string;
  email: string;
  amount: string;
  method: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validators.nombre(data.name)) {
    errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres.' });
  }

  if (!validators.email(data.email)) {
    errors.push({ field: 'email', message: 'Por favor ingresa un correo válido.' });
  }

  if (!validators.montoRango(data.amount, 10000, 1000000)) {
    errors.push({
      field: 'amount',
      message: 'El monto debe estar entre 10,000 y 1,000,000 USD.',
    });
  }

  if (!data.method) {
    errors.push({ field: 'method', message: 'Selecciona un método de pago.' });
  }

  return errors;
};

/**
 * Valida un formulario de fondeo
 */
export const validateFondeoForm = (data: {
  name: string;
  email: string;
  company: string;
  agreed: boolean;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validators.nombre(data.name)) {
    errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres.' });
  }

  if (!validators.email(data.email)) {
    errors.push({ field: 'email', message: 'Por favor ingresa un correo válido.' });
  }

  if (!data.company) {
    errors.push({ field: 'company', message: 'Selecciona una empresa de fondeo.' });
  }

  if (!data.agreed) {
    errors.push({
      field: 'agreed',
      message: 'Debes aceptar los términos de la evaluación externa.',
    });
  }

  return errors;
};

/**
 * Valida un formulario de Academia
 */
export const validateAcademiaForm = (data: {
  nombre: string;
  correo: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validators.nombre(data.nombre)) {
    errors.push({ field: 'nombre', message: 'El nombre debe tener al menos 2 caracteres.' });
  }

  if (!validators.email(data.correo)) {
    errors.push({ field: 'correo', message: 'Por favor ingresa un correo válido.' });
  }

  return errors;
};

/**
 * Valida un formulario de ticket de soporte
 */
export const validateTicketForm = (data: {
  categoria: string;
  prioridad: string;
  mensaje: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.categoria) {
    errors.push({ field: 'categoria', message: 'Selecciona una categoría.' });
  }

  if (!data.prioridad) {
    errors.push({ field: 'prioridad', message: 'Selecciona una prioridad.' });
  }

  if (!validators.required(data.mensaje) || data.mensaje.trim().length < 10) {
    errors.push({
      field: 'mensaje',
      message: 'El mensaje debe tener al menos 10 caracteres.',
    });
  }

  return errors;
};

/**
 * Valida campos editables de perfil
 */
export const validateProfileForm = (data: {
  nombre: string;
  correo: string;
  telefono?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validators.nombre(data.nombre)) {
    errors.push({ field: 'nombre', message: 'El nombre debe tener al menos 2 caracteres.' });
  }

  if (!validators.email(data.correo)) {
    errors.push({ field: 'correo', message: 'Por favor ingresa un correo válido.' });
  }

  if (data.telefono && !validators.telefono(data.telefono)) {
    errors.push({ field: 'telefono', message: 'Por favor ingresa un teléfono válido.' });
  }

  return errors;
};
