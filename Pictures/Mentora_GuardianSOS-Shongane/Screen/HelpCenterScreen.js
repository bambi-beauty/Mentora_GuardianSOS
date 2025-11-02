
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HelpCenterScreen({ navigation }) {
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <ScrollView style={styles.container}>
      {/* Header with Back Arrow */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subText}>
          Browse common questions or get help below.
        </Text>

        {/* Safety Tips Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => setShowSafetyTips(!showSafetyTips)}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#2A5B8C"
              style={styles.icon}
            />
            <Text style={styles.itemText}>Safety Tips</Text>
            <Ionicons
              name={showSafetyTips ? "chevron-up-outline" : "chevron-down-outline"}
              size={18}
              color="#2A5B8C"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
          {showSafetyTips && (
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>• Always share your live location with trusted contacts.</Text>
              <Text style={styles.contentText}>• Avoid poorly lit areas at night.</Text>
              <Text style={styles.contentText}>• Use the SOS button in emergencies.</Text>
            </View>
          )}
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => setShowContact(!showContact)}
          >
            <Ionicons
              name="mail-outline"
              size={22}
              color="#2A5B8C"
              style={styles.icon}
            />
            <Text style={styles.itemText}>Contact Support</Text>
            <Ionicons
              name={showContact ? "chevron-up-outline" : "chevron-down-outline"}
              size={18}
              color="#2A5B8C"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
          {showContact && (
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>📧 Email: support@guardiansos.com</Text>
              <Text style={styles.contentText}>📞 Phone: +27 11 123 4567</Text>
            </View>
          )}
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
    paddingVertical: 35,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: { 
    justifyContent: "center",
    paddingRight: 10 },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
    alignSelf: "center"
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
    marginBottom: 20,
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
  contentBox: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#f9fbff",
  },
  contentText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
});
