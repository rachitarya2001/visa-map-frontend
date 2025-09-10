import { useState } from "react";
import { Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface OTPLoginProps {
    onSuccess: (userData: any) => void;
    onCancel: () => void;
    onSwitchToRegister: () => void;
}

export function OTPLogin({ onSuccess, onCancel, onSwitchToRegister }: OTPLoginProps) {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation
    const validateEmail = () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setErrors({ email: "Please enter a valid email address" });
            return false;
        }
        setErrors({});
        return true;
    };

    // API functions
    const sendLoginOTP = async () => {
        if (!validateEmail()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5002/api/v1/auth/send-login-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep(2);
                setTimeLeft(600);
                startTimer();
                toast.success("OTP sent to your email!");
            } else {
                if (response.status === 404) {
                    toast.error("No account found with this email. Please register first.");
                } else {
                    toast.error(data.message || "Failed to send OTP");
                }
                setErrors({ email: data.message || "Failed to send OTP" });
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyLoginOTP = async () => {
        if (!otp || otp.length !== 6) {
            setErrors({ otp: "Please enter a 6-digit OTP" });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5002/api/v1/auth/verify-login-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep(3);

                // Store the auth token in localStorage
                console.log('✅ Login successful! Storing token:', data.data);
                if (data.data.accessToken) {
                    localStorage.setItem('authToken', data.data.accessToken);
                    console.log('🔑 Token stored successfully');
                } else {
                    console.error('❌ No accessToken in response:', data.data);
                }

                setTimeout(() => {
                    onSuccess(data.data);
                }, 2000);
            } else {
                toast.error(data.message || "Invalid OTP");
                setErrors({ otp: data.message || "Invalid OTP" });
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        if (step === 1) {
            sendLoginOTP();
        } else if (step === 2) {
            verifyLoginOTP();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-semibold">
                        {step === 1 && "Welcome Back"}
                        {step === 2 && "Verify Your Email"}
                        {step === 3 && "Login Successful!"}
                    </CardTitle>

                    {step === 1 && (
                        <p className="text-sm text-muted-foreground">
                            Enter your email to receive a login OTP
                        </p>
                    )}
                    {step === 2 && (
                        <p className="text-sm text-muted-foreground">
                            We've sent a 6-digit OTP to {email}
                        </p>
                    )}
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <>
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className={errors.email ? "border-red-500" : ""}
                                    onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <button
                                    onClick={onSwitchToRegister}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Register here
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 2: OTP Input */}
                    {step === 2 && (
                        <>
                            <div className="text-center">
                                <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    Enter the 6-digit code we sent to your email
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="otp">Enter OTP</Label>
                                <Input
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    className={`text-center text-lg font-mono tracking-widest ${errors.otp ? "border-red-500" : ""}`}
                                    maxLength={6}
                                    onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                                />
                                {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
                            </div>

                            {timeLeft > 0 ? (
                                <p className="text-center text-sm text-muted-foreground">
                                    OTP expires in {formatTime(timeLeft)}
                                </p>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm text-red-500 mb-2">OTP expired</p>
                                    <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                                        Request New OTP
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Welcome Back!</h3>
                            <p className="text-sm text-muted-foreground">
                                Login successful. Redirecting you to continue your visa journey...
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {step < 3 && (
                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(step - 1)}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            )}

                            <Button
                                onClick={handleNext}
                                className="flex-1"
                                disabled={loading || (step === 2 && (!otp || otp.length !== 6 || timeLeft === 0))}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {step === 1 && "Send OTP"}
                                {step === 2 && "Login"}
                            </Button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="text-center">
                            <Button variant="ghost" onClick={onCancel} className="text-sm">
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}