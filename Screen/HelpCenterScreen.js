
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HelpCenterScreen() {
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Help Center</Text>
      <Text style={styles.subText}>
        Browse common questions or get help below.
      </Text>

     
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowSafetyTips(!showSafetyTips)}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Safety Tips</Text>
          <Ionicons
            name={showSafetyTips ? "chevron-up-outline" : "chevron-down-outline"}
            size={18}
            color="#2171B5"
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

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowContact(!showContact)}
        >
          <Ionicons
            name="mail-outline"
            size={22}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Contact Support</Text>
          <Ionicons
            name={showContact ? "chevron-up-outline" : "chevron-down-outline"}
            size={18}
            color="#2171B5"
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
    padding: 20,
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
  icon: {
    marginRight: 12,
  },
  contentBox: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F9FBFF",
  },
  contentText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
});
