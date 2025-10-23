
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ContactUsScreen({ navigation }) {
  const handleEmail = () => {
    Linking.openURL("mailto:support@guardiansos.com");
  };

  const handlePhone = () => {
    Linking.openURL("tel:+27111234567");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subText}>
          Reach out to the Guardian SOS support team. We're here to help!
        </Text>

        <View style={styles.section}>
          <TouchableOpacity style={styles.item} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={22} color="#2A5B8C" style={styles.icon} />
            <Text style={styles.itemText}>Email: support@guardiansos.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handlePhone}>
            <Ionicons name="call-outline" size={22} color="#2A5B8C" style={styles.icon} />
            <Text style={styles.itemText}>Phone: +27 11 123 4567</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f8fc" },

  headerContainer: {
    backgroundColor: "#2A5B8C",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: { paddingRight: 10 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },

  body: { padding: 20 },
  subText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  icon: { marginRight: 12 },
});
