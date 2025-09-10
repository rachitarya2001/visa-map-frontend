import { useState, useEffect } from "react";
import { ArrowRight, MapPin, Plane, Calendar, CheckCircle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { toast } from "sonner";
import { getUserJourneys } from "@/lib/api";

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

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
}

interface DashboardProps {
    userData: UserData;
    onSignOut: () => void;
    onStartNewJourney: () => void;
    onContinueJourney: (journey: JourneyCard) => void;
}

export function Dashboard({ userData, onSignOut, onStartNewJourney, onContinueJourney }: DashboardProps) {
    const [journeys, setJourneys] = useState<JourneyCard[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock data - replace with actual API call
    useEffect(() => {
        const loadJourneys = async () => {
            setLoading(true);
            console.log('🔍 Loading journeys for user:', userData.email);

            try {
                // Check if auth token exists
                const token = localStorage.getItem('authToken');
                console.log('🔑 Auth token exists:', !!token);

                if (!token) {
                    console.error('❌ No auth token found');
                    setJourneys([]);
                    setLoading(false);
                    return;
                }

                // Fetch real journeys from API
                console.log('📡 Calling getUserJourneys API...');
                const response = await getUserJourneys();
                console.log('📊 API Response:', response);

                // Transform backend data to frontend format
                const formattedJourneys: JourneyCard[] = response.map((journey: any) => {
                    console.log('🔄 Processing journey:', journey);
                    return {
                        id: journey._id,
                        fromCountry: journey.originCountry,
                        toCountry: journey.destinationCountry,
                        fromCountryName: getCountryName(journey.originCountry),
                        toCountryName: getCountryName(journey.destinationCountry),
                        userType: journey.userType || 'student',
                        visaType: journey.visaType || 'student',
                        status: journey.status === 'completed' ? 'completed' :
                            journey.status === 'in_progress' ? 'in_progress' : 'pending',
                        createdAt: journey.timestamps?.journeyStarted || journey.createdAt,
                        lastUpdated: journey.timestamps?.lastActivity || journey.updatedAt,
                        progress: journey.progressMetrics?.completionPercentage || 0
                    };
                });

                console.log('✅ Formatted journeys:', formattedJourneys);
                setJourneys(formattedJourneys);
            } catch (error) {
                console.error('❌ Failed to load journeys:', error);

                // Try to get more details about the error
                if (error instanceof Error) {
                    console.error('Error message:', error.message);
                }

                // Fallback to empty array
                setJourneys([]);
            } finally {
                setLoading(false);
            }
        };

        // Helper function to get country names
        const getCountryName = (code: string): string => {
            const countryMap: Record<string, string> = {
                'IN': 'India',
                'GB': 'United Kingdom',
                'US': 'United States',
                'CA': 'Canada',
                'AU': 'Australia'
            };
            return countryMap[code] || code;
        };

        loadJourneys();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'in_progress':
                return 'In Progress';
            case 'pending':
                return 'Pending';
            default:
                return 'Unknown';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar with User Avatar */}
            <nav className="border-b bg-card/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                                VisaMonk
                            </h1>
                        </div>

                        <UserAvatarMenu
                            userData={userData}
                            onDashboard={() => { }} // Already on dashboard
                            onSignOut={onSignOut}
                        />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Welcome back, {userData.firstName}!
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your visa applications and track your progress
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mb-8">
                    <Button
                        onClick={onStartNewJourney}
                        className="bg-gradient-hero hover:opacity-90 text-white shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Start New Visa Journey
                    </Button>
                </div>

                {/* Journey Cards */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Your Visa Journeys</h2>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-4 bg-muted rounded w-3/4"></div>
                                        <div className="h-3 bg-muted rounded w-1/2"></div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="h-3 bg-muted rounded"></div>
                                            <div className="h-3 bg-muted rounded w-2/3"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : journeys.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                                    <Plane className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No visa journeys yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Start your first visa application journey and get step-by-step guidance
                                </p>
                                <Button onClick={onStartNewJourney} className="mt-4">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Start Your First Journey
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {journeys.map((journey) => (
                                <Card
                                    key={journey.id}
                                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:shadow-xl"
                                    onClick={() => onContinueJourney(journey)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {journey.fromCountryName}
                                            </CardTitle>
                                            <Badge className={getStatusColor(journey.status)}>
                                                {getStatusText(journey.status)}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <ArrowRight className="w-4 h-4" />
                                            <Plane className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{journey.toCountryName}</span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Visa Type:</span>
                                                <span className="font-medium">{journey.visaType}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">User Type:</span>
                                                <span className="font-medium">{journey.userType}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Progress:</span>
                                                <span className="font-medium">{journey.progress}%</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-gradient-hero h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${journey.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>Started {formatDate(journey.createdAt)}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>Updated {formatDate(journey.lastUpdated)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full mt-4 bg-gradient-hero hover:opacity-90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onContinueJourney(journey);
                                            }}
                                        >
                                            Continue Journey
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}