import { useState, useEffect } from "react";
import SelectCountries from "./SelectCountries";
import SelectUserType from "./SelectUserType";
import SelectVisaType from "./SelectVisaType";
import VisaDetails from "./VisaDetails";
import VisaDetailsComingSoon from "./VisaDetailsComingSoon";
import { Dashboard } from "@/components/Dashboard";
import { Footer } from "@/components/Footer";
import { VisaFlowState, UserFormData, PersonalizationData } from "@/types/visa";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dialingCode: string;
}

interface JourneyCard {
  id: string;
  fromCountry: string;
  toCountry: string;
  fromCountryName: string;
  toCountryName: string;
  userType: string;
  visaType: string;
  status: 'in_progress' | 'completed' | 'pending';
  createdAt: string;
  lastUpdated: string;
  progress: number;
}

export default function VisaMonkApp() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flowState, setFlowState] = useState<VisaFlowState>({
    fromCountry: null,
    toCountry: null,
    userType: null,
    visaType: null,
  });
  const [userFormData, setUserFormData] = useState<UserFormData | null>(null);
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData | null>(null);

  // User authentication and dashboard state
  const [user, setUser] = useState<UserData | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('visamonk_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('visamonk_user');
      }
    }
  }, []);

  const handleCountriesNext = (fromCountry: string, toCountry: string, userData: UserFormData, resumeJourney?: any) => {
    setFlowState({
      fromCountry,
      toCountry,
      userType: resumeJourney?.userType || null,
      visaType: resumeJourney?.visaType || null,
    });
    setUserFormData(userData);

    // If resuming, set personalization data and go to appropriate step
    if (resumeJourney) {
      setPersonalizationData(resumeJourney.personalizationData || null);
      setCurrentStep(resumeJourney.currentStep || 2);
    } else {
      setCurrentStep(2);
    }
  };

  const handleUserTypeNext = (userType: string) => {
    setFlowState(prev => ({
      ...prev,
      userType,
    }));
    setCurrentStep(3);
  };

  const handleVisaTypeNext = (visaType: string, personalization: PersonalizationData) => {
    setFlowState(prev => ({
      ...prev,
      visaType,
    }));
    setPersonalizationData(personalization);
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setFlowState({
      fromCountry: null,
      toCountry: null,
      userType: null,
      visaType: null,
    });
    setUserFormData(null);
    setPersonalizationData(null);
  };

  // User authentication handlers
  const handleUserLogin = (userData: any) => {
    setUser(userData.user);
    localStorage.setItem('visamonk_user', JSON.stringify(userData.user));
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('visamonk_user');
    setShowDashboard(false);
    resetFlow();
  };

  const handleDashboard = () => {
    setShowDashboard(true);
  };

  const handleStartNewJourney = () => {
    setShowDashboard(false);
    resetFlow();
  };

  const handleContinueJourney = (journey: JourneyCard) => {
    // Restore journey state and go to step 4
    setFlowState({
      fromCountry: journey.fromCountry,
      toCountry: journey.toCountry,
      userType: journey.userType,
      visaType: journey.visaType,
    });

    // Set user form data from the logged-in user
    if (user) {
      setUserFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        dialingCode: user.dialingCode,
      });
    }

    setShowDashboard(false);
    setCurrentStep(4);
  };

  // Show dashboard if user is logged in and dashboard is requested
  if (showDashboard && user) {
    return <Dashboard
      userData={user}
      onSignOut={handleSignOut}
      onStartNewJourney={handleStartNewJourney}
      onContinueJourney={handleContinueJourney}
    />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {(() => {
          switch (currentStep) {
            case 1:
              return (
                <SelectCountries
                  onNext={handleCountriesNext}
                  user={user}
                  onUserLogin={handleUserLogin}
                  onDashboard={handleDashboard}
                  onSignOut={handleSignOut}
                />
              );
            case 2:
              return (
                <SelectUserType
                  onNext={handleUserTypeNext}
                  onBack={handleBack}
                  user={user}
                  onDashboard={handleDashboard}
                  onSignOut={handleSignOut}
                />
              );
            case 3:
              return (
                <SelectVisaType
                  onNext={handleVisaTypeNext}
                  onBack={handleBack}
                  flowState={flowState}
                  user={user}
                  onDashboard={handleDashboard}
                  onSignOut={handleSignOut}
                />
              );
            case 4:
              return (
                <VisaDetails
                  onBack={handleBack}
                  userFormData={userFormData}
                  personalizationData={personalizationData}
                  user={user}
                  onDashboard={handleDashboard}
                  onSignOut={handleSignOut}
                />
              );
            default:
              return (
                <SelectCountries
                  onNext={handleCountriesNext}
                  user={user}
                  onUserLogin={handleUserLogin}
                  onDashboard={handleDashboard}
                  onSignOut={handleSignOut}
                />
              );
          }
        })()}
      </div>
      <Footer />
    </div>
  );
}