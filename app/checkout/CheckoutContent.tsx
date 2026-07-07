'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, ShoppingCart, Lock, Zap, DollarSign, Bitcoin } from 'lucide-react';

const PRODUCTS = {
  bot: {
    name: 'Bot CARVIPIX Pro',
    description: 'Automatización de operaciones con reglas personalizadas',
    price: 999.00,
    currency: 'USD',
    type: 'one-time',
    benefits: [
      'Automatiza tus operaciones',
      'Reglas operativas personalizables',
      'Integración con plataformas populares',
      'Soporte prioritario',
      'Actualizaciones constantes',
    ],
    paymentMethods: ['card', 'crypto', 'transfer'],
  },
  capital: {
    name: 'Solicitud de Capital Gestionado',
    description: 'Gestión privada de capital con participación en utilidades',
    price: 'Desde 10,000',
    currency: 'USD',
    type: 'investment',
    benefits: [
      'Capital mínimo: 10,000 USD',
      'Participación 60% cliente / 40% CARVIPIX',
      'Seguimiento privado de cuenta',
      'Reportes detallados mensuales',
      'Gestión disciplinada de riesgo',
    ],
    paymentMethods: ['crypto', 'transfer'],
  },
  fondeo: {
    name: 'Solicitud de Fondeo de Cuenta',
    description: 'Evaluación y seguimiento de fondeo con empresas externas',
    price: '5,000',
    currency: 'N/A',
    type: 'evaluation',
    benefits: [
      'Evaluación de solicitud',
      'Seguimiento del proceso',
      'Asesoramiento durante evaluación',
      'Acompañamiento personalizado',
      'Acceso a múltiples empresas',
    ],
    paymentMethods: ['transfer'],
  },
  academia: {
    name: 'Academia CARVIPIX - Lista de Espera',
    description: 'Acceso prioritario a contenido educativo especializado',
    price: 'Gratuito',
    currency: 'N/A',
    type: 'waitlist',
    benefits: [
      'Acceso prioritario al contenido',
      'Módulos especializados',
      'Certificación de finalización',
      'Comunidad de aprendices',
      'Actualizaciones continuas',
    ],
    paymentMethods: ['email'],
  },
  membership: {
    name: 'CARVIPIX PRO Membership',
    description: 'Acceso completo a todas las herramientas y servicios',
    price: 99,
    currency: 'USD',
    type: 'subscription',
    benefits: [
      'Acceso a todos los servicios',
      'Academia completa',
      'Señales avanzadas',
      'Herramientas exclusivas',
      'Soporte prioritario',
    ],
    paymentMethods: ['card', 'crypto'],
  },
};

type ProductKey = keyof typeof PRODUCTS;

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod: 'card' | 'crypto' | 'transfer' | 'email';
  termsAccepted: boolean;
  riskAccepted: boolean;
}

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const productParam = searchParams?.get('product') as ProductKey | null;
  
  const [product, setProduct] = useState<ProductKey | null>(productParam || 'bot');
  const [step, setStep] = useState<'form' | 'payment' | 'confirmation'>('form');
  const [orderNumber, setOrderNumber] = useState('');
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentMethod: 'card',
    termsAccepted: false,
    riskAccepted: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedProduct = product && PRODUCTS[product] ? PRODUCTS[product] : null;

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Producto no encontrado</p>
          <p className="text-white/60 mb-6">El producto solicitado no está disponible</p>
          <Link href="/" className="text-[#D4AF37] hover:underline">
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const checkoutErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      checkoutErrors.firstName = 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      checkoutErrors.lastName = 'El apellido es requerido';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      checkoutErrors.email = 'Por favor ingresa un correo válido';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      checkoutErrors.phone = 'Por favor ingresa un teléfono válido';
    }
    if (!formData.termsAccepted) {
      checkoutErrors.terms = 'Debes aceptar los términos y condiciones';
    }
    if ((product === 'bot' || product === 'capital' || product === 'membership') && !formData.riskAccepted) {
      checkoutErrors.risk = 'Debes reconocer que comprendes los riesgos';
    }

    return checkoutErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    setStep('payment');
  };

  const handlePaymentSubmit = () => {
    // Generar número de orden de referencia hasta integrar pasarela.
    const orderNum = `ORD-${Date.now().toString().slice(-8)}`;
    setOrderNumber(orderNum);
    setSubmitted(true);
    setTimeout(() => setStep('confirmation'), 500);
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white pt-20 lg:pt-0">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-6 h-6 text-[#D4AF37]" />
            <h1 className="text-3xl md:text-4xl font-bold">Checkout</h1>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === 'form' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/60'}`}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">1</div>
              <span className="text-sm font-semibold">Datos</span>
            </div>
            <div className="w-8 h-0.5 bg-white/10"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === 'payment' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/60'}`}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">2</div>
              <span className="text-sm font-semibold">Pago</span>
            </div>
            <div className="w-8 h-0.5 bg-white/10"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === 'confirmation' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/60'}`}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">3</div>
              <span className="text-sm font-semibold">Confirmar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form or Payment */}
          <div className="lg:col-span-2">
            {step === 'form' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-white/10 bg-[#0B0B0B] p-8"
              >
                <h2 className="text-2xl font-bold mb-6">Información personal</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${errors.firstName ? 'text-red-400' : 'text-white/70'}`}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border transition ${
                          errors.firstName
                            ? 'border-red-500/30 bg-red-500/10 text-white focus:border-red-400'
                            : 'border-white/10 bg-white/5 text-white focus:border-[#D4AF37]'
                        } outline-none`}
                        placeholder="Juan"
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${errors.lastName ? 'text-red-400' : 'text-white/70'}`}>
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border transition ${
                          errors.lastName
                            ? 'border-red-500/30 bg-red-500/10 text-white focus:border-red-400'
                            : 'border-white/10 bg-white/5 text-white focus:border-[#D4AF37]'
                        } outline-none`}
                        placeholder="Pérez"
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${errors.email ? 'text-red-400' : 'text-white/70'}`}>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition ${
                        errors.email
                          ? 'border-red-500/30 bg-red-500/10 text-white focus:border-red-400'
                          : 'border-white/10 bg-white/5 text-white focus:border-[#D4AF37]'
                      } outline-none`}
                      placeholder="juan@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${errors.phone ? 'text-red-400' : 'text-white/70'}`}>
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition ${
                        errors.phone
                          ? 'border-red-500/30 bg-red-500/10 text-white focus:border-red-400'
                          : 'border-white/10 bg-white/5 text-white focus:border-[#D4AF37]'
                      } outline-none`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3 border-t border-white/10 pt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5"
                      />
                      <span className={`text-sm ${errors.terms ? 'text-red-400' : 'text-white/70'}`}>
                        Acepto los términos y condiciones de CARVIPIX
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-xs text-red-400 flex items-center gap-1 ml-7">
                        <AlertCircle size={12} /> {errors.terms}
                      </p>
                    )}

                    {(product === 'bot' || product === 'capital' || product === 'membership') && (
                      <>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.riskAccepted}
                            onChange={(e) => handleInputChange('riskAccepted', e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5"
                          />
                          <span className={`text-sm ${errors.risk ? 'text-red-400' : 'text-white/70'}`}>
                            Entiendo que el trading implica riesgo significativo y he leído los términos de riesgo
                          </span>
                        </label>
                        {errors.risk && (
                          <p className="text-xs text-red-400 flex items-center gap-1 ml-7">
                            <AlertCircle size={12} /> {errors.risk}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-lg hover:bg-[#f5d76e] transition-all shadow-lg shadow-[#D4AF37]/30 mt-8"
                  >
                    Continuar al pago
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-white/10 bg-[#0B0B0B] p-8"
              >
                <h2 className="text-2xl font-bold mb-6">Método de pago</h2>

                {/* Payment Methods */}
                <div className="space-y-4 mb-8">
                  {selectedProduct.paymentMethods.includes('card') && (
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.paymentMethod === 'card' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-semibold flex items-center gap-2">
                          <DollarSign size={18} /> Tarjeta de Crédito/Débito
                        </p>
                        <p className="text-sm text-white/60">Disponible en la siguiente fase de activación de pagos</p>
                      </div>
                    </label>
                  )}

                  {selectedProduct.paymentMethods.includes('crypto') && (
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.paymentMethod === 'crypto' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="crypto"
                        checked={formData.paymentMethod === 'crypto'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-semibold flex items-center gap-2">
                          <Bitcoin size={18} /> Criptomoneda
                        </p>
                        <p className="text-sm text-white/60">Bitcoin, USDT y USDC</p>
                      </div>
                    </label>
                  )}

                  {selectedProduct.paymentMethods.includes('transfer') && (
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.paymentMethod === 'transfer' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-semibold flex items-center gap-2">
                          <Zap size={18} /> Transferencia / Manual
                        </p>
                        <p className="text-sm text-white/60">Pago manual o transferencia bancaria</p>
                      </div>
                    </label>
                  )}

                  {selectedProduct.paymentMethods.includes('email') && (
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.paymentMethod === 'email' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="email"
                        checked={formData.paymentMethod === 'email'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="ml-4">
                        <p className="font-semibold">Registro por Email</p>
                        <p className="text-sm text-white/60">Enviaremos detalles al correo</p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                  <p className="text-xs text-white/60 flex items-start gap-2">
                    <Lock size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Tu solicitud quedará registrada de forma segura. Recibirás confirmación inmediata y seguimiento por correo sobre el siguiente paso.</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 border-2 border-white/20 text-white font-bold py-4 rounded-lg hover:bg-white/5 transition"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    className="flex-1 bg-[#D4AF37] text-black font-bold py-4 rounded-lg hover:bg-[#f5d76e] transition-all shadow-lg shadow-[#D4AF37]/30"
                  >
                    Confirmar solicitud
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'confirmation' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-green-500/30 bg-green-500/10 p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 rounded-full border-4 border-green-400 bg-green-400/20 flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-8 h-8 text-green-400" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2 text-green-400">¡Solicitud recibida!</h2>
                <p className="text-white/70 mb-6">Tu solicitud de {selectedProduct.name.toLowerCase()} ha sido registrada</p>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
                  <p className="text-sm text-white/60 mb-2">Número de referencia:</p>
                  <p className="text-2xl font-mono font-bold text-[#D4AF37] mb-4">{orderNumber}</p>
                  <p className="text-xs text-white/50">Estado: <span className="text-yellow-400">Pendiente de validación</span></p>
                </div>

                <p className="text-sm text-white/70 mb-8">
                  Recibirás un correo en <strong>{formData.email}</strong> con los detalles de tu solicitud.
                </p>

                <div className="mb-8 rounded-lg border border-white/10 bg-[#0B0B0B]/60 p-5 text-left">
                  <p className="text-sm font-semibold text-white mb-3">Próximos pasos</p>
                  <ol className="space-y-2 text-sm text-white/75 list-decimal list-inside">
                    <li>Confirmación automática de recepción con tu número de referencia.</li>
                    <li>Validación interna de la solicitud y del producto seleccionado.</li>
                    <li>Notificación por correo con el estado actualizado y acciones a seguir.</li>
                    <li>Habilitación del servicio cuando la validación quede aprobada.</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/"
                    className="block w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#f5d76e] transition-all"
                  >
                    Volver al inicio
                  </Link>
                  <Link
                    href="/perfil"
                    className="block w-full border-2 border-[#D4AF37] text-[#D4AF37] font-bold py-3 rounded-lg hover:bg-[#D4AF37]/10 transition"
                  >
                    Ver mis solicitudes
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Side - Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="rounded-lg border border-[#D4AF37]/20 bg-gradient-to-br from-[#11161E] to-[#0B0B0B] p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4">Resumen del pedido</h3>

              {/* Product Info */}
              <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
                <div>
                  <p className="text-white/60 text-sm">Producto</p>
                  <p className="font-bold">{selectedProduct.name}</p>
                </div>
                <p className="text-xs text-white/50">{selectedProduct.description}</p>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3 text-white/70">Beneficios principales:</p>
                <ul className="space-y-2">
                  {selectedProduct.benefits.slice(0, 4).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <Check size={12} className="text-green-400 mt-1 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-white/70">Precio</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    {typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : selectedProduct.price}
                  </span>
                </div>
                {typeof selectedProduct.price === 'number' && (
                  <p className="text-xs text-white/50">{selectedProduct.currency} - Confirmación de solicitud</p>
                )}
              </div>

              {/* Estado de proceso */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-6">
                <p className="text-xs text-yellow-400 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Flujo en validación operativa hasta la activación de pagos en línea
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
