import React, { useState, useContext, useEffect } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, ScrollView, Alert, Modal
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

  const { user } = useUser();
  const { groups, loading, error, fetchGroups, createGroup, updateGroup, deleteGroup } = useContext(GroupsContext);

  const categories = ['All', 'Residential', 'Business', 'Campus', 'Park', 'Other'];

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const enterGroupChat = (group) => {
    setSelectedGroup(group);
    setActiveTab('chat');
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedGroup) return;

    const newMessage = {
      user: user?.name || 'You',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    };

    const updatedData = {
      ...selectedGroup,
      messages: [...selectedGroup.messages, newMessage],
      lastActive: 'Just now',
    };

    await updateGroup(selectedGroup._id, updatedData);
    setSelectedGroup(updatedData);
    setMessageText('');
  };

  const handleCreateGroup = async (newGroup) => {
    if (!newGroup.name.trim()) {
      Alert.alert('Group Name Required', 'Please enter a name for your group.');
      return;
    }

    const groupData = {
      name: newGroup.name,
      description: newGroup.description,
      category: newGroup.category || 'Residential',
      alerts: 0,
      members: 1,
      membersOnline: 1,
      createdBy: user?.name || 'You',
      messages: [],
    };

    await createGroup(groupData);
    setModalVisible(false);
    Alert.alert('Group Created!', `"${groupData.name}" has been created successfully.`);
  };

  const handleJoinGroup = async (group) => {
    const updatedData = {
      ...group,
      members: group.members + 1,
      membersOnline: group.membersOnline + 1,
    };
    await updateGroup(group._id, updatedData);
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
            const updatedData = {
              ...group,
              members: Math.max(0, group.members - 1),
              membersOnline: Math.max(0, group.membersOnline - 1),
            };
            await updateGroup(group._id, updatedData);
            if (selectedGroup && selectedGroup._id === group._id) {
              setActiveTab('groups');
              setSelectedGroup(null);
            }
          }
        }
      ]
    );
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
            <Text style={styles.createdBy}>Created by {group.createdBy}</Text>
            <View style={styles.groupActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.chatButton]}
                onPress={() => enterGroupChat(group)}
              >
                <FontAwesome name="comments" size={12} color="white" />
                <Text style={styles.actionButtonText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.leaveButton]}
                onPress={() => handleLeaveGroup(group)}
              >
                <FontAwesome name="sign-out" size={12} color="white" />
                <Text style={styles.actionButtonText}>Leave</Text>
              </TouchableOpacity>
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
              {selectedGroup.membersOnline} online • {selectedGroup.members} members
            </Text>
          </View>
        </View>

        <FlatList
          data={selectedGroup.messages || []}
          renderItem={({ item }) => (
            <View style={styles.messageBubble}>
              <Text style={styles.messageUser}>{item.user}</Text>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>{item.time}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messagesList}
        />

        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
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
      </View>

      {/* Create Group Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Create New Group</Text>

            <TextInput
              style={styles.input}
              placeholder="Group name"
              onChangeText={(name) => handleCreateGroup({ name })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Group description"
              multiline
              onChangeText={(description) => handleCreateGroup({ description })}
            />
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
          <Text style={{ textAlign: 'center', marginVertical: 20 }}>Loading groups...</Text>
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="users" size={48} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>
              No groups found. Be the first to create a community group!
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            renderItem={({ item }) => <GroupCard group={item} />}
            keyExtractor={(item) => item._id.toString()}
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
