import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, useColorScheme, Vibration, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const currencyToCountry: { [key: string]: string } = {
  EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', CHF: 'ch',
  CAD: 'ca', AUD: 'au', CNY: 'cn', INR: 'in', BRL: 'br',
  RUB: 'ru', KRW: 'kr', MXN: 'mx', ZAR: 'za', SEK: 'se',
  NOK: 'no', DKK: 'dk', PLN: 'pl', THB: 'th', IDR: 'id',
  HUF: 'hu', CZK: 'cz', ILS: 'il', CLP: 'cl', PHP: 'ph',
  AED: 'ae', COP: 'co', SAR: 'sa', MYR: 'my', RON: 'ro',
};

const currencySymbols: { [key: string]: string } = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF',
  CAD: 'C$', AUD: 'A$', CNY: '¥', INR: '₹', BRL: 'R$',
  RUB: '₽', KRW: '₩', MXN: '$', ZAR: 'R', SEK: 'kr',
  NOK: 'kr', DKK: 'kr', PLN: 'zł', THB: '฿', IDR: 'Rp',
  HUF: 'Ft', CZK: 'Kč', ILS: '₪', CLP: '$', PHP: '₱',
  AED: 'د.إ', COP: '$', SAR: '﷼', MYR: 'RM', RON: 'lei',
};

const getFlagUrl = (currencyCode: string): string => {
  const countryCode = currencyToCountry[currencyCode] || 'eu';
  return `https://flagcdn.com/72x54/${countryCode.toLowerCase()}.png`;
};

const currencyNames: { [key: string]: string } = {
  EUR: 'Euro', USD: 'Dollar américain', GBP: 'Livre sterling', JPY: 'Yen japonais',
  CHF: 'Franc suisse', CAD: 'Dollar canadien', AUD: 'Dollar australien',
  CNY: 'Yuan chinois', INR: 'Roupie indienne', BRL: 'Real brésilien',
  RUB: 'Rouble russe', KRW: 'Won sud-coréen', MXN: 'Peso mexicain',
  ZAR: 'Rand sud-africain', SEK: 'Couronne suédoise', NOK: 'Couronne norvégienne',
  DKK: 'Couronne danoise', PLN: 'Zloty polonais', THB: 'Baht thaïlandais',
  IDR: 'Roupie indonésienne', HUF: 'Forint hongrois', CZK: 'Couronne tchèque',
  ILS: 'Shekel israélien', CLP: 'Peso chilien', PHP: 'Peso philippin',
  AED: 'Dirham des EAU', COP: 'Peso colombien', SAR: 'Riyal saoudien',
  MYR: 'Ringgit malaisien', RON: 'Leu roumain',
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const colors = {
    background: isDark ? '#1a1a1a' : '#f5f5f5',
    cardBackground: isDark ? '#1f212c' : '#ffffff',
    pickerBackground: isDark ? '#1e1e1e' : '#ffffff',
    pickerHeader: isDark ? '#2d2d2d' : '#f8f8f8',
    border: isDark ? '#404040' : '#ddd',
    inputBackground: isDark ? '#2a2a2a' : '#f5f5f5',
    inputText: isDark ? '#ffffff' : '#000000',
    selectedItem: isDark ? '#1e3a5f' : '#e3f2fd',
  };

  useEffect(() => {
    fetchExchangeRates();
    loadSavedCurrencies();
  }, []);

  useEffect(() => {
    saveCurrencies();
  }, [fromCurrency, toCurrency]);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://open.er-api.com/v6/latest/EUR');
      const data = await response.json();
      setExchangeRates(data.rates);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des taux:', error);
      setLoading(false);
    }
  };

  const loadSavedCurrencies = async () => {
    try {
      const savedFrom = await AsyncStorage.getItem('fromCurrency');
      const savedTo = await AsyncStorage.getItem('toCurrency');
      if (savedFrom) setFromCurrency(savedFrom);
      if (savedTo) setToCurrency(savedTo);
    } catch (error) {
      console.error('Erreur lors du chargement des devises:', error);
    }
  };

  const saveCurrencies = async () => {
    try {
      await AsyncStorage.setItem('fromCurrency', fromCurrency);
      await AsyncStorage.setItem('toCurrency', toCurrency);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des devises:', error);
    }
  };

  const formatNumber = (value: string) => {
    const cleaned = value.replaceAll(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const parts = normalized.split('.');
    const hasDecimal = parts.length > 1;
    parts[0] = parts[0].replaceAll(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return hasDecimal ? parts[0] + ',' + parts.slice(1).join('').slice(0, 8) : parts[0];
  };

  const unformatNumber = (value: string) => {
    return value.replaceAll(/\s/g, '').replace(',', '.');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatNumber(value);
    setAmount(formatted);
    if (value.length > amount.length)
      Vibration.vibrate([0, 25, 0, 25], false);
  };

  const convertAmount = () => {
    const amountNum = Number.parseFloat(unformatNumber(amount)) || 0;
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const inEur = amountNum / exchangeRates[fromCurrency];
      const result = inEur * exchangeRates[toCurrency];
      return formatNumber(result.toFixed(2));
    }
    return '0.00';
  };

  const switchCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const availableCurrencies = Object.keys(currencyToCountry).filter(code => exchangeRates[code]);

  const CurrencyPicker = ({
    visible,
    onSelect,
    onClose,
    selected
  }: {
    visible: boolean;
    onSelect: (code: string) => void;
    onClose: () => void;
    selected: string;
  }) => {
    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.pickerBackground }]}>
            <View style={[styles.pickerHeader, { backgroundColor: colors.pickerHeader, borderBottomColor: colors.border }]}>
              <ThemedText type="subtitle">Sélectionner une devise</ThemedText>
              <TouchableOpacity onPress={onClose}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.pickerScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {availableCurrencies.map(code => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.currencyItem,
                    { borderBottomColor: colors.border },
                    selected === code && { backgroundColor: colors.selectedItem }
                  ]}
                  onPress={() => {
                    onSelect(code);
                    onClose();
                  }}
                >
                  <Image
                    source={{ uri: getFlagUrl(code) }}
                    style={styles.currencyFlag}
                    contentFit="contain"
                  />
                  <ThemedView style={styles.currencyInfo}>
                    <ThemedText style={styles.currencyCode}>{code}</ThemedText>
                    <ThemedText style={styles.currencyName}>{currencyNames[code] || code}</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b0c956" />
          <ThemedText style={styles.loadingText}>Chargement des taux...</ThemedText>
        </ThemedView>
    );
  }

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Devise source */}
        <ThemedView style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={() => setShowFromPicker(true)}
          >
            <Image
              source={{ uri: getFlagUrl(fromCurrency) }}
              style={styles.currencyButtonFlag}
              contentFit="contain"
            />
            <ThemedView style={styles.currencyButtonInfo}>
              <ThemedText style={styles.currencyButtonCode}>{fromCurrency}</ThemedText>
              <ThemedText style={styles.currencyButtonName}>{currencyNames[fromCurrency] || fromCurrency}</ThemedText>
            </ThemedView>
          </TouchableOpacity>

          <ThemedView style={{ backgroundColor: colors.cardBackground, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { color: colors.inputText, width: '90%' }]}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#999"
              autoFocus={true}
            />

            <ThemedText style={{  fontSize: 35, opacity: 0.5, height: "100%", textAlignVertical: "center" }}>
              {currencySymbols[fromCurrency] || fromCurrency}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Devise cible */}
        <ThemedView style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={() => setShowToPicker(true)}
          >
            <Image
              source={{ uri: getFlagUrl(toCurrency) }}
              style={styles.currencyButtonFlag}
              contentFit="contain"
            />
            <ThemedView style={styles.currencyButtonInfo}>
              <ThemedText style={styles.currencyButtonCode}>{toCurrency}</ThemedText>
              <ThemedText style={styles.currencyButtonName}>{currencyNames[toCurrency] || toCurrency}</ThemedText>
            </ThemedView>
          </TouchableOpacity>

          <ThemedView style={{ backgroundColor: colors.cardBackground, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText style={[styles.input, { color: colors.inputText, height: '100%', width: '90%' }]}>
              {convertAmount()}
            </ThemedText>

            <ThemedText style={{  fontSize: 35, opacity: 0.5, height: "100%", textAlignVertical: "center" }}>
              {currencySymbols[toCurrency] || toCurrency}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Bouton switch */}
        <ThemedView style={[styles.switchContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: colors.cardBackground }]}
            onPress={switchCurrencies}
          >
            <ThemedText style={styles.switchIcon}>⇅</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={{ backgroundColor: "transparent"}}>
          {fromCurrency !== toCurrency && (
            <ThemedText style={{ textAlign: 'center', fontSize: 16, opacity: 0.8, marginTop: 4 }}>
              1 {fromCurrency} = {formatNumber((exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(4))} {toCurrency}
            </ThemedText>
          )}
        </ThemedView>

        {/* button */}
        <ThemedView style={{ marginTop: 10, backgroundColor: "transparent" }}>
          <TouchableOpacity
            style={styles.resultContainer}
            onPress={fetchExchangeRates}
          >
            <ThemedText style={styles.resultLabel}>Mettre à jour les taux</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Pickers */}
      <CurrencyPicker
        visible={showFromPicker}
        selected={fromCurrency}
        onSelect={setFromCurrency}
        onClose={() => setShowFromPicker(false)}
      />
      <CurrencyPicker
        visible={showToPicker}
        selected={toCurrency}
        onSelect={setToCurrency}
        onClose={() => setShowToPicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    marginTop: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 0,
  },
  section: {
    marginBottom: 10,
    borderRadius: 22,
    height: "27%",
    padding: 16,
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  currencyButton: {
    height: "30%",
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  currencyButtonFlag: {
    width: 52,
    height: 36,
    marginRight: 12,
    borderRadius: 4,
  },
  currencyButtonInfo: {
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  currencyButtonCode: {
    fontSize: 26,
    fontWeight: '700',
  },
  currencyButtonName: {
    fontSize: 16,
    opacity: 0.6,
  },
  currencyButtonArrow: {
    fontSize: 16,
    opacity: 0.5,
  },
  input: {
    padding: 16,
    marginBottom: 10,
    fontSize: 48,
    fontWeight: '700',
    textAlignVertical: 'bottom',
    lineHeight: 52,
    borderRadius: 12,
    transform: [{ scaleY: 1.25 }],
  },
  switchContainer: {
    position: 'absolute',
    top: '27.5%',
    left: '50%',
    zIndex: 10,
    alignItems: 'center',
    backgroundColor: '#121418',
    padding: 8,
    borderRadius: 100,
  },
  switchButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#1f212c',
    elevation: 10,
  },
  switchIcon: {
    fontSize: 26,
    color: '#b0c956',
    fontWeight: 'bold',
    marginTop: -3.5,
  },
  resultContainer: {
    padding: 14,
    backgroundColor: '#b0c956',
    borderRadius: 50,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#121418',
    fontWeight: '700',
    opacity: 0.9,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    height: 30,
  },
  resultRate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 22,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pickerScroll: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  currencyFlag: {
    width: 48,
    height: 32,
    marginRight: 12,
    borderRadius: 4,
  },
  currencyInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  currencyName: {
    fontSize: 14,
    opacity: 0.6,
  },
  loadingContainer: {
    paddingTop: "90%",
    height: '100%',
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.9,
    fontStyle: 'italic',
  },
});
