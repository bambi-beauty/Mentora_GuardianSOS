import React, { useState, useContext, useEffect } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import styles from './CommunityStyles';
import { useUser } from '../../Users/useContext';
import { GroupsContext } from '../../groupContext/groupContext';

const NeighborhoodWatchScreen = () => {
  const [activeTab, setActiveTab] = useState('groups'); 
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false); 
  const [testingAPI, setTestingAPI] = useState(false);
  const [refreshingGroup, setRefreshingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(null);

  const { user } = useUser();
  const { 
    groups, 
    loading, 
    error, 
    fetchGroups, 
    createGroup, 
    joinGroup, 
    leaveGroup, 
    addMessage,
    fetchGroupById,
    testConnection,
    testAuth,
    clearError,
    refreshGroups,
    debugInfo
  } = useContext(GroupsContext);

  const categories = ['All', 'Residential', 'Business', 'Campus', 'Park', 'Other'];

  useEffect(() => {
    const loadGroups = async () => {
      console.log('🔍 Fetching groups...');
      try {
        await fetchGroups(selectedCategory);
      } catch (err) {
        console.error('Failed to load groups:', err);
        // Error is already handled in context
      }
    };
    
    loadGroups();
  }, [selectedCategory]);

  // Test API connection using context
  const testAPIConnection = async () => {
    setTestingAPI(true);
    try {
      console.log('🧪 Testing API connection using context...');
      const result = await testConnection();
      
      if (result.success) {
        Alert.alert('API Test Success', 'Server is running and accessible!');
      } else {
        Alert.alert('API Test Failed', 
          `Cannot connect to backend server.\n\nError: ${result.error}`
        );
      }
    } catch (error) {
      console.error('❌ API Test Failed:', error);
      Alert.alert('API Test Failed', 
        `Unexpected error during API test.\n\nError: ${error.message}`
      );
    } finally {
      setTestingAPI(false);
    }
  };

  // Test authentication using context
  const testAuthConnection = async () => {
    setTestingAPI(true);
    try {
      console.log('🧪 Testing authentication using context...');
      const result = await testAuth();
      
      if (result.success) {
        Alert.alert('Auth Test Success', 'Authentication is working correctly!');
      } else {
        Alert.alert('Auth Test Failed', 
          `Authentication failed.\n\nError: ${result.error}`
        );
      }
    } catch (error) {
      console.error('❌ Auth Test Failed:', error);
      Alert.alert('Auth Test Failed', 
        `Unexpected error during auth test.\n\nError: ${error.message}`
      );
    } finally {
      setTestingAPI(false);
    }
  };

  const enterGroupChat = async (group) => {
    try {
      setRefreshingGroup(true);
      console.log('🚪 Entering group chat:', group._id, group.name);
      
      // First ensure user is a member of the group
      if (!group.isMember) {
        console.log('👤 User not a member, joining group first...');
        await handleJoinGroup(group, true); // silent join for chat entry
      }
      
      // Fetch the latest group data with messages
      console.log('📥 Fetching fresh group data...');
      const freshGroup = await fetchGroupById(group._id);
      console.log('✅ Group data fetched:', {
        name: freshGroup.name,
        messages: freshGroup.messages?.length,
        members: freshGroup.members
      });
      
      setSelectedGroup(freshGroup);
      setActiveTab('chat');
    } catch (error) {
      console.error('❌ Error entering group chat:', error);
      Alert.alert('Error', error.message || 'Failed to load group chat. Please try again.');
    } finally {
      setRefreshingGroup(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedGroup) return;

    try {
      console.log('📤 Sending message to group:', selectedGroup._id);
      
      // Add message via API
      await addMessage(selectedGroup._id, {
        text: messageText,
        type: 'text'
        // userId is automatically handled by backend
      });
      
      console.log('✅ Message sent, refreshing group...');
      
      // Refresh the group to get the latest messages
      const updatedGroup = await fetchGroupById(selectedGroup._id);
      setSelectedGroup(updatedGroup);
      setMessageText('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    }
  };

  // GROUP CREATION FUNCTION
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Group Name Required', 'Please enter a name for your group.');
      return;
    }

    setCreatingGroup(true);
    
    const groupData = {
      name: newGroupName,
      description: newGroupDescription,
      category: selectedCategory === 'All' ? 'Residential' : selectedCategory,
    };

    console.log('🔄 Creating group:', groupData);

    try {
      await createGroup(groupData);
      setNewGroupName('');
      setNewGroupDescription('');
      setModalVisible(false);
      Alert.alert('Success!', `"${groupData.name}" has been created successfully.`);
    } catch (error) {
      console.error('❌ Group creation failed:', error);
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (group, silent = false) => {
    try {
      setJoiningGroup(group._id);
      console.log('👥 Joining group:', group._id, group.name);
      
      await joinGroup(group._id);
      
      if (!silent) {
        Alert.alert('Success!', `You have joined ${group.name}`);
      }
      
      // Refresh groups list to update membership status
      await fetchGroups(selectedCategory);
      
    } catch (error) {
      console.error('❌ Join group failed:', error);
      if (!silent) {
        Alert.alert('Error', error.message || 'Failed to join group');
      }
      throw error; // Re-throw for chat entry flow
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleLeaveGroup = async (group) => {
    Alert.alert(
      'Leave Group?',
      'Are you sure you want to leave this group? You will lose access to all group messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('👋 Leaving group:', group._id);
              await leaveGroup(group._id);
              
              if (selectedGroup && selectedGroup._id === group._id) {
                setActiveTab('groups');
                setSelectedGroup(null);
              }
              
              // Refresh groups list
              await fetchGroups(selectedCategory);
              Alert.alert('Success', `You have left ${group.name}`);
            } catch (error) {
              console.error('❌ Leave group failed:', error);
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  // Handle retry with error clearing
  const handleRetry = () => {
    clearError();
    fetchGroups(selectedCategory);
  };

  // Enhanced debugging function
  const debugGroupData = (group) => {
    console.log('🔍 Group Debug Info:', {
      id: group._id,
      name: group.name,
      isMember: group.isMember,
      members: group.members,
      messagesCount: group.messages?.length,
      createdBy: group.createdBy
    });
  };

  // Debug context state
  const debugContextState = () => {
    console.log('🔍 Context Debug Info:', debugInfo);
    console.log('📊 Current State:', {
      groupsCount: groups.length,
      loading,
      error,
      selectedCategory,
      user: user ? { id: user._id, email: user.email } : 'No user'
    });
    
    Alert.alert(
      'Debug Info',
      `Groups: ${groups.length}\nLoading: ${loading}\nError: ${error || 'None'}\nUser: ${user ? 'Logged in' : 'Not logged in'}\nToken: ${debugInfo.hasToken ? 'Present' : 'Missing'}`
    );
  };

  // FIXED: Safe rendering of createdBy field
  const getCreatedByText = (group) => {
    if (!group.createdBy) return 'Unknown user';
    
    if (typeof group.createdBy === 'string') {
      return group.createdBy;
    }
    
    if (typeof group.createdBy === 'object') {
      return group.createdBy.name || group.createdBy.email || 'Unknown user';
    }
    
    return 'Unknown user';
  };

  const filteredGroups = groups.filter(group => {
    if (selectedCategory === 'All') return true;
    return group.category === selectedCategory;
  });

  // UI Components
  const Stat = ({ icon, text }) => (
    <View style={styles.stat}>
      <FontAwesome name={icon} size={10} color="#64748B" />
      <Text style={styles.statText}>{text}</Text>
    </View>
  );

  const GroupCard = ({ group }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <FontAwesome name="users" size={20} color="#1E40AF" />
        </View>
        <View style={styles.groupContent}>
          <View style={styles.groupTitleRow}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(group.category) }]}>
              <Text style={styles.categoryText}>{group.category}</Text>
            </View>
          </View>
          <Text style={styles.groupDescription}>{group.description}</Text>
          <View style={styles.groupStats}>
            <Stat icon="users" text={`${group.members || 0} members`} />
            <Stat icon="user" text={`${group.membersOnline || 0} online`} />
            <Stat icon="bell" text={`${group.alerts || 0} alerts`} />
            <Stat icon="clock-o" text={group.lastActive || 'Recently'} />
          </View>
          <View style={styles.groupFooter}>
            {/* FIXED: Safe rendering of createdBy */}
            <Text style={styles.createdBy}>Created by {getCreatedByText(group)}</Text>
            <View style={styles.groupActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.chatButton]}
                onPress={() => {
                  debugGroupData(group);
                  enterGroupChat(group);
                }}
                disabled={refreshingGroup || joiningGroup === group._id}
              >
                {(refreshingGroup && selectedGroup?._id === group._id) || joiningGroup === group._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome name="comments" size={12} color="white" />
                    <Text style={styles.actionButtonText}>Chat</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* Show Join button if not a member, Leave button if member */}
              {group.isMember ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.leaveButton]}
                  onPress={() => handleLeaveGroup(group)}
                  disabled={joiningGroup === group._id}
                >
                  <FontAwesome name="sign-out" size={12} color="white" />
                  <Text style={styles.actionButtonText}>Leave</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.joinButton]}
                  onPress={() => handleJoinGroup(group)}
                  disabled={joiningGroup === group._id}
                >
                  {joiningGroup === group._id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <FontAwesome name="sign-in" size={12} color="white" />
                      <Text style={styles.actionButtonText}>Join</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Chat View
  if (activeTab === 'chat' && selectedGroup) {
    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setActiveTab('groups');
              setSelectedGroup(null);
            }}
          >
            <FontAwesome name="arrow-left" size={20} color="#2A5B8C" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatGroupName}>{selectedGroup.name}</Text>
            <Text style={styles.chatGroupStatus}>
              {selectedGroup.membersOnline || 0} online • {selectedGroup.members || 0} members
            </Text>
          </View>
        </View>

        <FlatList
          data={selectedGroup.messages || []}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.userId === user?._id && styles.myMessageBubble
            ]}>
              {/* FIXED: Safe rendering of message user */}
              <Text style={styles.messageUser}>
                {item.userId === user?._id ? 'You' : (item.user || 'Unknown')}
              </Text>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>
                {item.time}
              </Text>
            </View>
          )}
          keyExtractor={(item, index) => `${item._id || index}-${item.time}`}
          style={styles.messagesList}
          inverted={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <FontAwesome name="send" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main Groups Screen
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Neighborhood Watch</Text>
        <Text style={styles.headerSubtitle}>
          Connect with your community, join safety groups, and chat with neighbors to keep your area secure.
        </Text>

        <TouchableOpacity
          style={styles.createGroupButton}
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome name="plus-circle" size={18} color="white" />
          <Text style={styles.createGroupButtonText}>Create New Group</Text>
        </TouchableOpacity>

        {/* Connection Test Buttons
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: '#8B5CF6' }]}
            onPress={testAPIConnection}
            disabled={testingAPI}
          >
            {testingAPI ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome name="wifi" size={16} color="white" />
            )}
            <Text style={styles.testButtonText}>
              {testingAPI ? 'Testing...' : 'Test API'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: '#10B981' }]}
            onPress={testAuthConnection}
            disabled={testingAPI}
          >
            {testingAPI ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome name="shield" size={16} color="white" />
            )}
            <Text style={styles.testButtonText}>
              {testingAPI ? 'Testing...' : 'Test Auth'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: '#6B7280' }]}
            onPress={debugContextState}
          >
            <FontAwesome name="bug" size={16} color="white" />
            <Text style={styles.testButtonText}>Debug</Text>
          </TouchableOpacity>
        </View> */}

        {error && (
          <View style={styles.errorBanner}>
            <FontAwesome name="exclamation-triangle" size={16} color="#EF4444" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Create Group MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                }}
              >
                <FontAwesome name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Group name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              maxLength={50}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Group description"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            
            <Text style={styles.filterLabel}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.filter(cat => cat !== 'All').map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, selectedCategory === category && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextSelected]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.createGroupMainButton, 
                (!newGroupName.trim() || creatingGroup) && styles.createGroupMainButtonDisabled
              ]}
              onPress={handleCreateGroup}
              disabled={!newGroupName.trim() || creatingGroup}
            >
              {creatingGroup ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <FontAwesome name="users" size={18} color="white" />
                  <Text style={styles.createGroupMainButtonText}>Create Group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, selectedCategory === category && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextSelected]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Groups List */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.cardTitle}>
          {selectedCategory === 'All' ? 'All Community Groups' : `${selectedCategory} Groups`} 
          <Text style={{ color: '#64748B', fontWeight: 'normal' }}> ({filteredGroups.length})</Text>
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2A5B8C" />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Connection Error</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="users" size={48} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'All' 
                ? 'No groups found. Be the first to create a community group!'
                : `No ${selectedCategory} groups found. Create the first one!`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            renderItem={({ item }) => <GroupCard group={item} />}
            keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

const getCategoryColor = (category) => {
  const colors = {
    Residential: '#E0F2FE',
    Business: '#F3E8FF',
    Campus: '#DCFCE7',
    Park: '#FEF3C7',
    Other: '#F1F5F9'
  };
  return colors[category] || colors.Other;
};

export default NeighborhoodWatchScreen;