import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../Users/useContext";

export default function ProfileDetailsScreen({ navigation }) {

  const handleEdit =()=>navigation.navigate("EditProfileScreen");
  const {user,selectedCountry,selectedState,selectedCity,selectedStreet} = useUser();
  
  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
      </View>


      <View style={styles.profileContainer}>
        <Image
          source={require("../assets/avatar-placeholder.png")}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user ? user.name : 'Guest'}</Text>
        <Text style={styles.email}>{user ? user.email : 'Guest'}</Text>

        <TouchableOpacity
        style={styles.editButton}
        onPress={handleEdit} 
      >
        <Ionicons name="pencil-outline" size={16} color="#2171B5" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>


      </View>
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Personal Info:</Text>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Full Name:</Text>
          <Text style={styles.detailValue}>{user ? user.name : 'Guest'}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{user ? user.email : 'Guest'}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{user ? user.phoneNumber : ''}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{selectedCountry},{selectedState},{selectedCity},{selectedStreet}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
    marginTop:20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2171B5",
    paddingVertical: 15,
    paddingHorizontal: 15,
    height:60
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
  },
  profileContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    paddingVertical: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#777",
    marginBottom: 15,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2171B5",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: "#2171B5",
    fontWeight: "bold",
    marginLeft: 6,
  },
  detailsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2171B5",
    marginBottom: 15,
  },
  detailItem: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: "#777",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginTop: 3,
  },
});