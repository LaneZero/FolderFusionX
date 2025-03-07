import React, { useState } from 'react';
import { Wallet, Copy, X, Bitcoin, DollarSign, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CryptoWalletProps {
  darkMode?: boolean;
}

interface Network {
  name: string;
  symbol: string;
  address: string;
}

interface Cryptocurrency {
  name: string;
  symbol: string;
  networks: Network[];
}

export const CryptoWallet: React.FC<CryptoWalletProps> = ({ darkMode = false }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const cryptocurrencies: Cryptocurrency[] = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      networks: [
        {
          name: 'Bitcoin',
          symbol: 'BTC (BEP20)',
          address: 'bc1q5tl36qpk27hf7upl8l753xa0gcm57adrvmwgkz'
        }
      ]
    },
    {
      name: 'Tether',
      symbol: 'USDT',
      networks: [
        {
          name: 'Tether USDT',
          symbol: 'TRC20',
          address: 'TA5pibChqS7CeHiDvfP7V3uQVMynk6SxLq'
        },
        {
          name: 'Binance Smart Chain (BEP20)',
          symbol: 'BSC',
          address: '0x6634E26BA0e323182B7A9a89278E9a7BbCa9aF70'
        },
        {
          name: 'TRON (TRC20)',
          symbol: 'TRX',
          address: 'TA5pibChqS7CeHiDvfP7V3uQVMynk6SxLq'
        },
        {
          name: 'Polygon',
          symbol: 'MATIC',
          address: '0x6634E26BA0e323182B7A9a89278E9a7BbCa9aF70'
        },
        {
          name: 'Solana',
          symbol: 'SOL',
          address: '91kuBFEZAnRk8ixsuzAQnAVvtzLAsQpPFRsfe285ZKUC'
        },
        {
          name: 'Ethereum',
          symbol: 'Ethereum TRC20',
          address: '0x6634E26BA0e323182B7A9a89278E9a7BbCa9aF70'
        }
      ]
    }
  ];

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-full ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}
        aria-label="Crypto Wallet"
        title={t('wallet.title')}
      >
        <Wallet className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl rounded-lg shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between border-b p-4 ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wallet className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                <span>{t('wallet.title')}</span>
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-full ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {cryptocurrencies.map((crypto) => (
                <div key={crypto.symbol} className="mb-6">
                  <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    {crypto.symbol === 'BTC' ? (
                      <Bitcoin className={`w-6 h-6 ${
                        darkMode ? 'text-orange-400' : 'text-orange-500'
                      }`} />
                    ) : (
                      <DollarSign className={`w-6 h-6 ${
                        darkMode ? 'text-green-400' : 'text-green-500'
                      }`} />
                    )}
                    <h3 className="text-lg font-medium">{crypto.name} ({crypto.symbol})</h3>
                  </div>

                  <div className="space-y-3">
                    {crypto.networks.map((network) => (
                      <div key={network.symbol} className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{network.name}</span>
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{network.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className={`text-sm flex-1 px-3 py-2 rounded ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                          }`}>
                            {network.address}
                          </code>
                          <button
                            onClick={() => handleCopy(network.address)}
                            className={`px-3 py-2 rounded-md transition-colors ${
                              copiedAddress === network.address
                                ? darkMode
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-500 text-white'
                                : darkMode
                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            {copiedAddress === network.address ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`border-t p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('wallet.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};