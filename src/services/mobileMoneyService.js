const axios = require('axios');
const mobileMoneyConfig = require('../config/mobileMoneyConfig');

/**
 * Initiate Mobile Money Payment
 */
exports.initiateMobileMoneyPayment = async (paymentData) => {
  const { amount, phoneNumber, provider, studentName, trimester } = paymentData;

  try {
    // Development mode - return mock payment
    if (process.env.NODE_ENV === 'development') {
      return {
        transactionId: `DEV-${Date.now()}`,
        paymentUrl: null,
        status: 'pending',
        message: 'Mode développement - Paiement simulé'
      };
    }

    // Use FedaPay as aggregator (recommended for West Africa)
    if (process.env.FEDAPAY_API_KEY && process.env.FEDAPAY_API_KEY !== 'demo_fedapay_key') {
      return await initiateFedaPayPayment(paymentData);
    }

    // Fallback to individual providers
    switch (provider?.toLowerCase()) {
      case 'mtn':
        return await initiateMTNPayment(paymentData);
      case 'moov':
        return await initiateMoovPayment(paymentData);
      case 'vodafone':
        return await initiateVodafonePayment(paymentData);
      default:
        throw new Error('Fournisseur de paiement non supporté');
    }
  } catch (error) {
    console.error('Erreur initiation paiement:', error);
    throw new Error(`Échec de l'initiation du paiement: ${error.message}`);
  }
};

/**
 * Verify Mobile Money Payment
 */
exports.verifyMobileMoneyPayment = async (transactionId) => {
  try {
    // Development mode
    if (process.env.NODE_ENV === 'development' || transactionId.startsWith('DEV-')) {
      return {
        status: 'completed',
        transactionId,
        amount: 0,
        message: 'Paiement vérifié (mode développement)'
      };
    }

    // Check if using FedaPay
    if (process.env.FEDAPAY_API_KEY && process.env.FEDAPAY_API_KEY !== 'demo_fedapay_key') {
      return await verifyFedaPayPayment(transactionId);
    }

    // Default response
    return {
      status: 'pending',
      transactionId,
      message: 'Vérification en cours'
    };
  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    throw new Error(`Échec de la vérification du paiement: ${error.message}`);
  }
};

// ============= FEDAPAY INTEGRATION =============

async function initiateFedaPayPayment(paymentData) {
  const { amount, phoneNumber, studentName, trimester } = paymentData;

  try {
    const response = await axios.post(
      `${mobileMoneyConfig.fedapay.baseUrl}/transactions`,
      {
        description: `Paiement bulletin - ${studentName} - ${trimester}`,
        amount: amount,
        currency: mobileMoneyConfig.fedapay.currency,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/webhook/mobile-money`,
        customer: {
          phone_number: {
            number: phoneNumber,
            country: 'BJ' // Benin - adjust based on your country (GH for Ghana, TG for Togo, etc.)
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.FEDAPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      transactionId: response.data.id || response.data.reference,
      paymentUrl: response.data.payment_url || response.data.token,
      status: 'pending'
    };
  } catch (error) {
    console.error('FedaPay error:', error.response?.data || error.message);
    throw new Error(`Erreur FedaPay: ${error.response?.data?.message || error.message}`);
  }
}

async function verifyFedaPayPayment(transactionId) {
  try {
    const response = await axios.get(
      `${mobileMoneyConfig.fedapay.baseUrl}/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FEDAPAY_API_KEY}`
        }
      }
    );

    return {
      status: response.data.status === 'approved' ? 'completed' : response.data.status,
      transactionId: response.data.id,
      amount: response.data.amount,
      message: response.data.message || 'Paiement vérifié'
    };
  } catch (error) {
    console.error('FedaPay verification error:', error.response?.data || error.message);
    throw new Error(`Erreur vérification FedaPay: ${error.response?.data?.message || error.message}`);
  }
}

// ============= MTN MOBILE MONEY =============

async function initiateMTNPayment(paymentData) {
  const { amount, phoneNumber, studentName, trimester } = paymentData;

  try {
    const reference = `NB-MTN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await axios.post(
      `${mobileMoneyConfig.mtn.baseUrl}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: mobileMoneyConfig.mtn.currency,
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: `Paiement bulletin ${trimester}`,
        payeeNote: `${studentName} - ${trimester}`
      },
      {
        headers: {
          'Authorization': `Bearer ${await getMTNAccessToken()}`,
          'X-Reference-Id': reference,
          'X-Target-Environment': mobileMoneyConfig.mtn.environment,
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.MTN_API_KEY
        }
      }
    );

    return {
      transactionId: reference,
      paymentUrl: null,
      status: 'pending',
      message: 'Veuillez approuver le paiement sur votre téléphone'
    };
  } catch (error) {
    console.error('MTN error:', error.response?.data || error.message);
    throw new Error(`Erreur MTN: ${error.message}`);
  }
}

async function getMTNAccessToken() {
  try {
    const response = await axios.post(
      `${mobileMoneyConfig.mtn.baseUrl}/collection/token/`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.MTN_API_KEY
        },
        auth: {
          username: process.env.MTN_API_KEY,
          password: process.env.MTN_API_SECRET
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    throw new Error('Échec de l\'authentification MTN');
  }
}

// ============= MOOV MONEY =============

async function initiateMoovPayment(paymentData) {
  const { amount, phoneNumber, studentName, trimester } = paymentData;

  const reference = `NB-MOOV-${Date.now()}`;

  // Moov Money typically uses USSD
  return {
    transactionId: reference,
    paymentUrl: null,
    status: 'pending',
    message: 'Veuillez composer *155# pour finaliser le paiement Moov Money',
    ussdCode: '*155#'
  };
}

// ============= VODAFONE CASH =============

async function initiateVodafonePayment(paymentData) {
  const { amount, phoneNumber, studentName, trimester } = paymentData;

  const reference = `NB-VODA-${Date.now()}`;

  // Vodafone Cash typically uses USSD
  return {
    transactionId: reference,
    paymentUrl: null,
    status: 'pending',
    message: 'Veuillez composer *110# pour finaliser le paiement Vodafone Cash',
    ussdCode: '*110#'
  };
}