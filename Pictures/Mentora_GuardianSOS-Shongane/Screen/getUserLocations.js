import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../Users/useContext';

export default function LocationSelectorSimple() {
  const {
    countries,
    states,
    cities,
    streets,
    selectedCountry,
    selectedState,
    selectedCity,
    selectedStreet,
    setSelectedCountry,
    setSelectedState,
    setSelectedCity,
    setSelectedStreet,
    fetchCountries,
    fetchStates,
    fetchCities,
    fetchStreets,
    locationLoading,
  } = useUser();

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    } else {
      // Clear dependent selections and data if no country
      setSelectedState('');
      setSelectedCity('');
      setSelectedStreet('');
    }
  }, [selectedCountry]);

  // Fetch cities when selectedState changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      fetchCities(selectedCountry, selectedState);
    } else {
      setSelectedCity('');
      setSelectedStreet('');
    }
  }, [selectedState, selectedCountry]);

  // Fetch streets when selectedCity changes
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      fetchStreets(selectedCountry, selectedCity);
    } else {
      setSelectedStreet('');
    }
  }, [selectedCity, selectedCountry]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Country:</Text>
      {locationLoading.countries ? (
        <ActivityIndicator color="#6a11cb" />
      ) : (
        <Picker
          selectedValue={selectedCountry}
          onValueChange={setSelectedCountry}
          style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
        >
          <Picker.Item label="-- Select Country --" value="" />
          {countries.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
      )}

      <Text style={styles.label}>State:</Text>
      {locationLoading.states ? (
        <ActivityIndicator color="#6a11cb" />
      ) : (
        <Picker
          enabled={states.length > 0}
          selectedValue={selectedState}
          onValueChange={setSelectedState}
          style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
        >
          <Picker.Item label="-- Select State --" value="" />
          {states.map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      )}

      <Text style={styles.label}>City:</Text>
      {locationLoading.cities ? (
        <ActivityIndicator color="#6a11cb" />
      ) : (
        <Picker
          enabled={cities.length > 0}
          selectedValue={selectedCity}
          onValueChange={setSelectedCity}
          style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
        >
          <Picker.Item label="-- Select City --" value="" />
          {cities.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
      )}

      <Text style={styles.label}>Street:</Text>
      {locationLoading.streets ? (
        <ActivityIndicator color="#6a11cb" />
      ) : (
        <Picker
          enabled={streets.length > 0}
          selectedValue={selectedStreet}
          onValueChange={setSelectedStreet}
          style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
        >
          <Picker.Item label="-- Select Street --" value="" />
          {streets.map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      )}

      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>🌍 Country: {selectedCountry || 'None'}</Text>
        <Text style={styles.selectedText}>🏞 State: {selectedState || 'None'}</Text>
        <Text style={styles.selectedText}>🌆 City: {selectedCity || 'None'}</Text>
        <Text style={styles.selectedText}>🛣 Street: {selectedStreet || 'None'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9fafd',
    flex: 1,
  },
  label: {
    fontWeight: '700',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 8,
    color: '#6a11cb',
  },
  pickerAndroid: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
  },
  pickerIOS: {
    height: 200,
    width: '100%',
    backgroundColor: 'white',
  },
  selectedContainer: {
    marginTop: 40,
    backgroundColor: '#6a11cb',
    padding: 20,
    borderRadius: 20,
  },
  selectedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 6,
  },
});
