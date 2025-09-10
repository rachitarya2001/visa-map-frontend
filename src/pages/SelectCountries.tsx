import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeftRight, X, MapPin, Plane, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisaMonkLogo } from "@/components/VisaMonkLogo";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountryVisaCards } from "@/components/CountryVisaCards";
import { StatsSection } from "@/components/StatsSection";
import { PlaceholderSection } from "@/components/PlaceholderSection";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { Country, UserFormData } from "@/types/visa";
import { Toaster } from "@/components/ui/sonner";
import { OTPRegistration } from "@/components/OTPRegistration";
import { OTPLogin } from "@/components/OTPLogin";
import { saveProgress, getOriginCountries, getDestinationCountries, checkRouteSupport } from "@/lib/api";
import { checkResumeJourney } from "@/lib/api";
import { getUserJourneys } from "@/lib/api";


// Fallback countries for when API is not available
const fallbackCountries: Country[] = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
];

// Fallback dialing codes
const fallbackDialingCodes = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
];

interface SelectCountriesProps {
  onNext: (fromCountry: string, toCountry: string, userData: UserFormData, resumeJourney?: any) => void;
  user?: any;
  onUserLogin?: (userData: any) => void;
  onDashboard?: () => void;
  onSignOut?: () => void;
}

export default function SelectCountries({
  onNext,
  user,
  onUserLogin,
  onDashboard,
  onSignOut
}: SelectCountriesProps) {
  const [fromCountry, setFromCountry] = useState<string>("");
  const [toCountry, setToCountry] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showComingSoon, setShowComingSoon] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [comingSoonCountries, setComingSoonCountries] = useState<{ from: string, to: string }>({ from: "", to: "" });
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    dialingCode: "+91",
  });
  const [formError, setFormError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  // Dynamic data state
  const [originCountries, setOriginCountries] = useState<Country[]>([]);
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([]);
  const [dialingCodes, setDialingCodes] = useState(fallbackDialingCodes);
  const [loading, setLoading] = useState(true);
  const [checkingRoute, setCheckingRoute] = useState(false);

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);

        // Load origin and destination countries in parallel
        const [origins, destinations] = await Promise.all([
          getOriginCountries(),
          getDestinationCountries()
        ]);

        setOriginCountries(origins);
        setDestinationCountries(destinations);

        // Create dialing codes from countries data
        const allCountries = [...origins, ...destinations];
        const uniqueDialingCodes = allCountries
          .filter(country => country.dialingCode)
          .map(country => ({
            code: country.dialingCode!,
            country: country.name,
            flag: country.flag
          }))
          .filter((code, index, self) =>
            index === self.findIndex(c => c.code === code.code)
          );

        if (uniqueDialingCodes.length > 0) {
          setDialingCodes(uniqueDialingCodes);
        }

      } catch (error) {
        console.error('Failed to load countries:', error);
        // Use fallback data
        setOriginCountries(fallbackCountries.filter(c => c.code === "IN" || c.code === "NG"));
        setDestinationCountries(fallbackCountries.filter(c => c.code !== "IN" && c.code !== "NG"));
        toast.error("Failed to load countries. Using offline data.");
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  const handleSwap = () => {
    const temp = fromCountry;
    setFromCountry(toCountry);
    setToCountry(temp);
    setError("");
  };

  const handleContinue = () => {
    if (!fromCountry || !toCountry) {
      setError("Please select both countries");
      return;
    }
    if (fromCountry === toCountry) {
      setError("Origin and destination countries cannot be the same");
      return;
    }
    setError("");
    setShowForm(true);
  };

  const validateEmail = (email: string) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else if (!email) {
      setEmailError("Email is required");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, mobile: phone }));
  };

  const handleFormSubmit = async () => {
    // If user is already logged in, use their data and skip validation
    if (user) {
      const userFormData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        dialingCode: user.dialingCode,
      };

      // Save progress
      const progressData = {
        email: user.email,
        originCountry: fromCountry,
        destinationCountry: toCountry,
        timestamps: {
          countrySelection: new Date().toISOString()
        }
      };
      saveProgress(progressData);

      // Check route support and proceed
      setCheckingRoute(true);
      try {
        const isSupported = await checkRouteSupport(fromCountry, toCountry);

        if (!isSupported) {
          setComingSoonCountries({ from: fromCountry, to: toCountry });
          setShowComingSoon(true);
          return;
        }

        onNext(fromCountry, toCountry, userFormData);
      } catch (error) {
        console.error('Failed to check route support:', error);
        // Fallback: only support IN->GB for now
        const isSupported = fromCountry === "IN" && toCountry === "GB";

        if (!isSupported) {
          setComingSoonCountries({ from: fromCountry, to: toCountry });
          setShowComingSoon(true);
          return;
        }

        onNext(fromCountry, toCountry, userFormData);
      } finally {
        setCheckingRoute(false);
      }
      return;
    }

    // Original validation logic for anonymous users
    let hasErrors = false;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError("First name and last name are required");
      hasErrors = true;
    } else {
      setFormError("");
    }

    if (!formData.email || !validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      hasErrors = true;
    } else {
      setEmailError("");
    }

    if (!formData.mobile || !validatePhone(formData.mobile)) {
      setFormError("Please enter a valid phone number");
      hasErrors = true;
    }

    if (hasErrors) return;

    // Save progress for anonymous users
    if (formData.email) {
      const progressData = {
        email: formData.email,
        originCountry: fromCountry,
        destinationCountry: toCountry,
        timestamps: {
          countrySelection: new Date().toISOString()
        }
      };
      saveProgress(progressData);
    }

    // Check route support for anonymous users
    setCheckingRoute(true);
    try {
      const isSupported = await checkRouteSupport(fromCountry, toCountry);

      if (!isSupported) {
        setComingSoonCountries({ from: fromCountry, to: toCountry });
        setShowComingSoon(true);
        setShowForm(false);
        return;
      }

      onNext(fromCountry, toCountry, formData);
    } catch (error) {
      console.error('Failed to check route support:', error);
      // Fallback: only support IN->GB for now
      const isSupported = fromCountry === "IN" && toCountry === "GB";

      if (!isSupported) {
        setComingSoonCountries({ from: fromCountry, to: toCountry });
        setShowComingSoon(true);
        setShowForm(false);
        return;
      }

      onNext(fromCountry, toCountry, formData);
    } finally {
      setCheckingRoute(false);
    }
  };

  const getCountryDisplayName = (code: string) => {
    const allCountries = [...originCountries, ...destinationCountries];
    const country = allCountries.find(c => c.code === code);
    if (country && country.code === "GB") {
      return "UK";
    }
    return country?.name || "";
  };

  const getCountryFlag = (code: string) => {
    const allCountries = [...originCountries, ...destinationCountries];
    return allCountries.find(c => c.code === code)?.flag || "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return false;
    const phoneRegex = /^[0-9]{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleCountryCardSelect = (countryCode: string) => {
    setToCountry(countryCode);
    // Scroll to country selection section
    document.querySelector('[data-country-selection]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  const getDepartureCountries = () => {
    return originCountries.length > 0 ? originCountries : fallbackCountries.filter(country => country.code === "IN" || country.code === "NG");
  };

  const getDestinationCountriesForSelection = () => {
    if (!fromCountry) return destinationCountries.length > 0 ? destinationCountries : fallbackCountries;
    return destinationCountries.length > 0
      ? destinationCountries.filter(country => country.code !== fromCountry)
      : fallbackCountries.filter(country => country.code !== fromCountry);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted/50 flex flex-col">
      <Navbar user={user} onDashboard={onDashboard} onSignOut={onSignOut} />

      <div className="flex-1 container mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col mb-6 lg:mb-8">
          <div className="mb-6 lg:mb-8 animate-fade-in">
            <ProgressIndicator
              currentStep={1}
              totalSteps={4}
              steps={["Countries", "User Type", "Visa Type", "Details"]}
            />
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 lg:mb-10">
            <h1 className="text-2xl md:text-2xl lg:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Where are you traveling?
            </h1>
            <p className="text-muted-foreground text-lg lg:text-l max-w-1xl mx-auto">
              Select your origin and destination countries to get started with your visa application guide.
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm" data-country-selection>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-semibold text-foreground/90">
                Travel Route Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-end gap-6 lg:gap-8 mb-8">
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <label className="text-base font-semibold text-foreground">
                      Origin Country
                    </label>
                  </div>
                  <Select value={fromCountry} onValueChange={setFromCountry}>
                    <SelectTrigger className="w-full h-14 bg-gradient-to-r from-muted/40 to-muted/30 text-foreground border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <SelectValue placeholder="🌍 Select your departure country" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                      {loading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading countries...</span>
                        </div>
                      ) : (
                        getDepartureCountries().map((country) => (
                          <SelectItem
                            key={country.code}
                            value={country.code}
                            className="hover:bg-primary/5 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{country.flag}</span>
                              <span className="font-medium">{country.code === "GB" ? "UK" : country.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center lg:mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwap}
                    className="w-12 h-12 bg-gradient-hero rounded-full hover:bg-gradient-hero/90 shadow-branded hover:shadow-lg transition-all duration-300 group"
                    aria-label="Swap origin and destination"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-300" />
                  </Button>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Plane className="w-5 h-5 text-primary" />
                    <label className="text-base font-semibold text-foreground">
                      Destination Country
                    </label>
                  </div>
                  <Select value={toCountry} onValueChange={setToCountry}>
                    <SelectTrigger className="w-full h-14 bg-gradient-to-r from-muted/40 to-muted/30 text-foreground border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <SelectValue placeholder="🎯 Select your destination country" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                      {loading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading countries...</span>
                        </div>
                      ) : (
                        getDestinationCountriesForSelection().map((country) => (
                          <SelectItem
                            key={country.code}
                            value={country.code}
                            className="hover:bg-primary/5 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{country.flag}</span>
                              <span className="font-medium">{country.code === "GB" ? "UK" : country.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 animate-fade-in">
                  <p className="text-destructive text-sm font-medium text-center">{error}</p>
                </div>
              )}

              <Button
                onClick={user ? handleFormSubmit : () => setShowForm(true)}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                disabled={!fromCountry || !toCountry || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue Your Journey
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </>
                )}
              </Button>

              {/* Add Login Link */}
              {!user && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-sm text-muted-foreground hover:text-primary underline"
                  >
                    Already have an account? Login here
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Country Visa Cards Section */}
        <CountryVisaCards onCountrySelect={handleCountryCardSelect} />

        {/* Stats Section */}
        <StatsSection />

        {/* Placeholder Section */}
        <PlaceholderSection />
      </div>

      {/* Authentication Modals */}
      {/* Authentication Modals */}
      {!user && (
        <>

          {showForm && authMode === 'register' && (
            <OTPRegistration
              onSuccess={(userData) => {
                setShowForm(false);
                console.log('Registration successful:', userData);

                if (onUserLogin) {
                  onUserLogin(userData);
                }

                // Extract user data from the registration response
                const user = userData.user;
                const registrationFormData = {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  mobile: user.mobile,
                  dialingCode: user.dialingCode,
                };

                // Update form data
                setFormData(registrationFormData);

                // Check if countries are selected, if not show error
                if (!fromCountry || !toCountry) {
                  toast.error("Please select your origin and destination countries first.");
                  return;
                }

                // Proceed to next step with countries
                onNext(fromCountry, toCountry, registrationFormData);
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {showLogin && (
            <OTPLogin
              onSuccess={async (userData) => {
                setShowLogin(false);
                console.log('Login successful:', userData);

                if (onUserLogin) {
                  onUserLogin(userData);
                }

                // Extract user data from the login response
                const user = userData.user;
                const loginFormData = {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  mobile: user.mobile,
                  dialingCode: user.dialingCode,
                };

                // Update form data
                setFormData(loginFormData);

                // Check for resume journey FIRST
                try {
                  const resumeData = await checkResumeJourney(user.email);

                  if (resumeData?.shouldResume) {
                    // Auto-resume the previous journey
                    const journey = resumeData.journey;
                    toast.success(`Resuming your ${journey.fromCountry} → ${journey.toCountry} journey...`);

                    // Call onNext with the previous journey data to continue where left off
                    onNext(journey.fromCountry, journey.toCountry, loginFormData, journey);
                    return;
                  }
                } catch (error) {
                  console.error('Failed to check resume journey:', error);
                  // Continue with normal flow if resume check fails
                }

                // Check if countries are selected, if not show error
                if (!fromCountry || !toCountry) {
                  toast.error("Please select your origin and destination countries first.");
                  return;
                }

                // Proceed to next step with countries
                onNext(fromCountry, toCountry, loginFormData);
              }}
              onCancel={() => setShowLogin(false)}
              onSwitchToRegister={() => {
                setShowLogin(false);
                setAuthMode('register');
                setShowForm(true);
              }}
            />
          )}
        </>
      )}

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        fromCountry={comingSoonCountries.from}
        toCountry={comingSoonCountries.to}
      />

      <Toaster />
    </div>
  );
}