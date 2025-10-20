
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ContactUsScreen() {
  const handleEmail = () => {
    Linking.openURL("mailto:support@guardiansos.com");
  };

  const handlePhone = () => {
    Linking.openURL("tel:+27111234567");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Contact Us</Text>
      <Text style={styles.subText}>
        Reach out to the Guardian SOS support team. We're here to help!
      </Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={handleEmail}>
          <Ionicons name="mail-outline" size={22} color="#2171B5" style={styles.icon} />
          <Text style={styles.itemText}>Email: support@guardiansos.com</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handlePhone}>
          <Ionicons name="call-outline" size={22} color="#2171B5" style={styles.icon} />
          <Text style={styles.itemText}>Phone: +27 11 123 4567</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
    padding: 20,
    marginTop:30
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2171B5",
    marginBottom: 8,
  },
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
  icon: {
    marginRight: 12,
  },
});
