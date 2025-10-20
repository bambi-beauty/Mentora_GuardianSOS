import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../Users/useContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';

export default function ContactActivityLog() {
  const { user, getContactsByUser } = useUser();
  const [contacts, setContacts] = useState([]);

 useEffect(() => {
  const fetchContacts = async () => {
    if (user?._id) {
      console.log('Fetching contacts for user:', user._id);
      const fetchedContacts = await getContactsByUser(user._id);
      console.log('Fetched contacts:', fetchedContacts);
      setContacts(fetchedContacts);
    } else {
      console.log('No user found!');
    }
  };

  fetchContacts();
}, [user]);


  return (
    <View>
      {contacts.map((item) => {
        const timeAgo = moment(item.createdAt).fromNow();
        return (
          <View style={styles.alertItem} key={item._id}>
            <View style={styles.alertIcon}>
              <Icon name="user" size={16} color="#2A5B8C" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Emergency Contact Added</Text>
              <Text style={styles.alertText}>
                {item.name} was added as your emergency contact
              </Text>
              <Text style={styles.alertTime}>{timeAgo}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  alertItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 10,
    marginTop: 3,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2A5B8C',
  },
  alertText: {
    fontSize: 14,
    marginTop: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
