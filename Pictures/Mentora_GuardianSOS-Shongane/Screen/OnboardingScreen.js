import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useUser } from '../Users/useContext'; 

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { 
    user, 
    getOnboardingStatus, 
    hasCompletedOnboarding,
    completeOnboardingStep 
  } = useUser();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState({
    completed: false,
    missingSteps: [],
    progress: 0,
    steps: {}
  });

  // Check onboarding status when component mounts or user changes
  useEffect(() => {
    if (user) {
      const status = getOnboardingStatus();
      setOnboardingStatus(status);
      console.log('📊 Onboarding Status:', status);
      
      // If already completed, navigate to main app
      if (status.completed) {
        console.log('✅ Onboarding already completed, navigating to main app');
        navigation.replace('MainApp');
      }
    }
  }, [user, getOnboardingStatus]);

  // Update current step based on missing steps
  useEffect(() => {
    if (onboardingStatus.missingSteps.length > 0) {
      const stepOrder = ['basic_info', 'emergency_contacts', 'profile_image'];
      const nextStep = stepOrder.find(step => 
        onboardingStatus.missingSteps.includes(step)
      );
      
      if (nextStep) {
        const stepIndex = stepOrder.indexOf(nextStep);
        setCurrentStep(stepIndex);
      }
    }
  }, [onboardingStatus.missingSteps]);

  const steps = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Complete your profile information',
      screen: 'ProfileSetup', 
      required: true
    },
    {
      id: 'emergency_contacts',
      title: 'Emergency Contacts',
      description: 'Add your emergency contacts for safety',
      screen: 'EmergencyContacts', 
      required: true
    },
    {
      id: 'profile_image',
      title: 'Profile Photo',
      description: 'Upload a profile picture',
      screen: 'Add_Image', 
      required: true
    }
  ];

  const handleStepPress = async (step) => {
    try {
      setLoading(true);
      
      // Navigate to the appropriate screen
      navigation.navigate(step.screen, {
        onComplete: () => handleStepComplete(step.id)
      });
      
    } catch (error) {
      console.error('❌ Error navigating to step:', error);
      Alert.alert('Error', 'Failed to navigate to step');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepId) => {
    try {
      console.log(`✅ Step ${stepId} completed`);
      
      // Refresh onboarding status
      const newStatus = getOnboardingStatus();
      setOnboardingStatus(newStatus);
      
      // Check if all steps are completed
      if (newStatus.completed) {
        console.log('🎉 All onboarding steps completed!');
        Alert.alert(
          'Welcome!',
          'Your profile setup is complete. Welcome to the app!',
          [
            {
              text: 'Get Started',
              onPress: () => navigation.replace('MainApp')
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error handling step completion:', error);
    }
  };

  const handleSkipOnboarding = async () => {
    Alert.alert(
      'Skip Onboarding?',
      'Are you sure you want to skip onboarding? You can complete it later in settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.replace('MainApp')
        }
      ]
    );
  };

  const getStepStatus = (stepId) => {
    return onboardingStatus.steps[stepId] || false;
  };

  const renderStep = (step, index) => {
    const isCompleted = getStepStatus(step.id);
    const isCurrent = currentStep === index;
    const isAccessible = currentStep >= index || isCompleted;

    return (
      <TouchableOpacity
        key={step.id}
        style={[
          styles.stepContainer,
          isCompleted && styles.stepCompleted,
          isCurrent && styles.stepCurrent,
          !isAccessible && styles.stepDisabled
        ]}
        onPress={() => isAccessible && handleStepPress(step)}
        disabled={!isAccessible || loading}
      >
        <View style={styles.stepHeader}>
          <View style={[
            styles.stepIndicator,
            isCompleted && styles.stepIndicatorCompleted,
            isCurrent && styles.stepIndicatorCurrent
          ]}>
            {isCompleted ? (
              <Text style={styles.stepIndicatorText}>✓</Text>
            ) : (
              <Text style={styles.stepIndicatorText}>{index + 1}</Text>
            )}
          </View>
          
          <View style={styles.stepInfo}>
            <Text style={[
              styles.stepTitle,
              isCompleted && styles.stepTitleCompleted,
              !isAccessible && styles.stepTitleDisabled
            ]}>
              {step.title}
            </Text>
            <Text style={[
              styles.stepDescription,
              !isAccessible && styles.stepDescriptionDisabled
            ]}>
              {step.description}
            </Text>
          </View>
          
          {isCompleted && (
            <Text style={styles.completedText}>Completed</Text>
          )}
        </View>
        
        {isCurrent && !isCompleted && (
          <Text style={styles.currentStepText}>
            Tap to complete this step
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Finish setting up your account to get the most out of the app
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${onboardingStatus.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {onboardingStatus.progress}% Complete
            </Text>
          </View>
        </View>

        {/* Steps List */}
        <View style={styles.stepsList}>
          {steps.map((step, index) => renderStep(step, index))}
        </View>

        {/* Completion Status */}
        {onboardingStatus.completed && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>🎉 Setup Complete!</Text>
            <Text style={styles.completionText}>
              Your profile is fully set up. You're ready to use all features of the app.
            </Text>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => navigation.replace('MainApp')}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {!onboardingStatus.completed && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipOnboarding}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerNote}>
            {onboardingStatus.missingSteps.length} steps remaining
          </Text>
        </View>
      )}
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  stepsList: {
    marginBottom: 20,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  stepCompleted: {
    borderColor: '#28A745',
    backgroundColor: '#F8FFF9',
  },
  stepCurrent: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  stepDisabled: {
    opacity: 0.6,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C757D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#28A745',
  },
  stepIndicatorCurrent: {
    backgroundColor: '#007AFF',
  },
  stepIndicatorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: '#28A745',
  },
  stepTitleDisabled: {
    color: '#6C757D',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
  stepDescriptionDisabled: {
    color: '#ADB5BD',
  },
  completedText: {
    color: '#28A745',
    fontWeight: '600',
    fontSize: 12,
  },
  currentStepText: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  completionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#28A745',
    marginTop: 20,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  getStartedButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#6C757D',
    fontSize: 16,
  },
  footerNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#ADB5BD',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingScreen;