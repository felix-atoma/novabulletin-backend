module.exports = {
  // Configuration MTN Mobile Money
  mtn: {
    apiKey: process.env.MTN_API_KEY,
    apiSecret: process.env.MTN_API_SECRET,
    baseUrl: 'https://api.mtn.com/v1',
    currency: 'XOF',
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
  },
  
  // Configuration Moov Money
  moov: {
    apiKey: process.env.MOOV_API_KEY,
    apiSecret: process.env.MOOV_API_SECRET,
    baseUrl: 'https://api.moov.com',
    currency: 'XOF',
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
  },
  
  // Configuration Vodafone Cash
  vodafone: {
    apiKey: process.env.VODAFONE_API_KEY,
    apiSecret: process.env.VODAFONE_API_SECRET,
    baseUrl: 'https://api.vodafone.com',
    currency: 'XOF',
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
  },
  
  // Configuration Fedapay (agrégateur)
  fedapay: {
    apiKey: process.env.FEDAPAY_API_KEY,
    baseUrl: 'https://api.fedapay.com/v1',
    currency: 'XOF'
  }
};