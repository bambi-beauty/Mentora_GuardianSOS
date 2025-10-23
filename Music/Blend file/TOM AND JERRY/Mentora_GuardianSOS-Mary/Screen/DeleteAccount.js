 import React, { useState } from 'react';
 import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   ActivityIndicator,
 } from 'react-native';
 import Toast from 'react-native-toast-message';
 import { useUser } from '../Users/useContext'
 const DeleteAccount = ({ navigation }) => {
   const { deleteUser } = useUser();
   const [loading, setLoading] = useState(false)
   const confirmDelete = () => {
     // Show confirmation toast using custom modal-like approach
     Toast.show({
       type: 'info',
       text1: 'Confirm Deletion',
       text2: 'This action is irreversible.',
       visibilityTime: 3000,
       autoHide: true,
       position: 'top',
     })
     // Optional: You can implement a real modal confirmation instead of a toast
     // Here's just showing how to proceed with deletion directly
     handleDelete(); // Proceed directly if skipping Alert
   }
   const handleDelete = async () => {
     setLoading(true);
     try {
       await deleteUser(); // Assuming async deletion
       Toast.show({
         type: 'success',
         text1: 'Account Deleted',
         text2: 'Your account has been successfully removed.',
       })
       navigation.reset({
         index: 0,
         routes: [{ name: 'LoginScreen' }],
       });
     } catch (error) {
       Toast.show({
         type: 'error',
         text1: 'Deletion Failed',
         text2: 'Please try again later.',
       });
       console.error('Error deleting account:', error);
     } finally {
       setLoading(false);
     }
   }
   return (
     <View style={styles.container}>
       <Text style={styles.header}>Delete Account</Text>
       <TouchableOpacity
         style={[styles.button, loading && styles.disabledButton]}
         onPress={confirmDelete}
         disabled={loading}
       >
         {loading ? (
           <ActivityIndicator color="#fff" />
         ) : (
           <Text style={styles.buttonText}>Delete My Account</Text>
         )}
       </TouchableOpacity>
     </View>
   );
 }
 const styles = StyleSheet.create({
   container: {
     padding: 20,
     backgroundColor: '#fff',
     flex: 1,
     justifyContent: 'center',
   },
   header: {
     fontSize: 26,
     fontWeight: 'bold',
     color: '#2A5B8C',
     textAlign: 'center',
     marginBottom: 30,
   },
   button: {
     backgroundColor: '#2A5B8C',
     paddingVertical: 15,
     borderRadius: 8,
   },
   disabledButton: {
     backgroundColor: '#7A9BB8',
   },
   buttonText: {
     color: '#fff',
     textAlign: 'center',
     fontSize: 18,
     fontWeight: '600',
   },
 })
 export default DeleteAccount;
