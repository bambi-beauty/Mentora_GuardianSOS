import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const alerts = require("../alerts.json");

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [isSafetyModeOn, setIsSafetyModeOn] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < alerts.length) {
        const newAlert = alerts[index];
        setNotifications((prev) => [newAlert, ...prev]);
        if (isSafetyModeOn) {
          Alert.alert("Safety Alert", newAlert.title);
        }
        index++;
      } else {
        clearInterval(interval);
      }
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [isSafetyModeOn]);

  const handlePress = (item) => {
    if (isSafetyModeOn) {
      Alert.alert("Safety Alert", item.title);
    } else {
      Alert.alert("Safety Mode Off", "Enable safety mode to see alerts.");
    }
  };

  const renderItem = ({ item }) => {
    let iconName = "alert-circle";
    let iconColor = "#FF5C5C";
    if (item.type === "tip") {
      iconName = "bulb";
      iconColor = "#FFD700";
    } else if (item.type === "reminder") {
      iconName = "location";
      iconColor = "#2A5B8C";
    }

    return (
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={() => handlePress(item)}
      >
        <View style={styles.cardContent}>
          <Ionicons
            name={iconName}
            size={28}
            color={iconColor}
            style={styles.cardIcon}
          />
          <Text style={styles.notificationText}>{item.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      {/* BODY */}
      <Text style={styles.subHeading}>
        Stay updated with nearby alerts and safety tips.
      </Text>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Safety Mode</Text>
        <Switch
          value={isSafetyModeOn}
          onValueChange={(value) => setIsSafetyModeOn(value)}
        />
      </View>

      {notifications.length === 0 ? (
        <Text style={styles.emptyText}>No safety alerts yet</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF3FF" },

  header: {
    backgroundColor: "#2A5B8C",
    paddingTop: (StatusBar.currentHeight || 40) + 5,
    paddingBottom: 18,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },

  subHeading: {
    fontSize: 14,
    color: "#555",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 16, fontWeight: "bold", color: "#333" },

  notificationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardIcon: { marginRight: 12 },
  notificationText: { flex: 1, fontSize: 15, color: "#333" },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 50, color: "#888" },
});
