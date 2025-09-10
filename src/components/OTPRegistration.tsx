import { useState } from "react";
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface OTPRegistrationProps {
    onSuccess: (userData: any) => void;
    onCancel: () => void;
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    dialingCode: string;
}

export function OTPRegistration({ onSuccess, onCancel }: OTPRegistrationProps) {
    const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Password, 4: Success
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        dialingCode: "+91",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation functions
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!formData.mobile || !/^[0-9]{7,15}$/.test(formData.mobile)) {
            newErrors.mobile = "Please enter a valid phone number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // API functions
    const sendOTP = async () => {
        if (!validateStep1()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5002/api/v1/auth/send-registration-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    mobile: formData.mobile,
                    dialingCode: formData.dialingCode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep(2);
                setTimeLeft(600); // Reset timer
                startTimer();
                toast.success("OTP sent to your email!");
            } else {
                toast.error(data.message || "Failed to send OTP");
                if (data.errors) {
                    const newErrors: Record<string, string> = {};
                    data.errors.forEach((error: any) => {
                        newErrors[error.field] = error.message;
                    });
                    setErrors(newErrors);
                }
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setErrors({ otp: "Please enter a 6-digit OTP" });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5002/api/v1/auth/verify-registration-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otp,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep(3); // Show success step
                toast.success("Registration completed successfully!");

                // Call onSuccess immediately (don't wait)
                setTimeout(() => {
                    onSuccess(data.data);
                }, 1500); // Reduced from 2000 to 1500ms
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
            sendOTP();
        } else if (step === 2) {
            verifyOTP(); // Go directly to verify OTP, skip password step
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-semibold">
                        {step === 1 && "Create Your Account"}
                        {step === 2 && "Verify Your Email"}
                        {step === 3 && "Welcome to VisaMonk!"}
                    </CardTitle>

                    {step === 2 && (
                        <p className="text-sm text-muted-foreground">
                            We've sent a 6-digit OTP to {formData.email}
                        </p>
                    )}
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Step 1: User Details */}
                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        placeholder="Enter first name"
                                        className={errors.firstName ? "border-red-500" : ""}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        placeholder="Enter last name"
                                        className={errors.lastName ? "border-red-500" : ""}
                                    />
                                    {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email address"
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                            </div>

                            <div>
                                <Label htmlFor="mobile">Mobile/WhatsApp *</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.dialingCode} onValueChange={(value) => setFormData(prev => ({ ...prev, dialingCode: value }))}>
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="+91">🇮🇳 +91</SelectItem>
                                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                            <SelectItem value="+61">🇦🇺 +61</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        id="mobile"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
                                        placeholder="Enter mobile number"
                                        className={`flex-1 ${errors.mobile ? "border-red-500" : ""}`}
                                    />
                                </div>
                                {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
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
                                />
                                {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}
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

                    {/* Step 4: Success */}
                    {/* Step 3: Success (was Step 4) */}
                    {step === 3 && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Account Created Successfully!</h3>
                            <p className="text-sm text-muted-foreground">
                                Welcome to VisaMonk. Redirecting you to continue your visa journey...
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {/* Action Buttons */}
                    {step < 3 && ( // Changed from step < 4 to step < 3
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
                                onClick={step === 1 ? sendOTP : verifyOTP} // Simplified: only 2 steps now
                                className="flex-1"
                                disabled={loading || (step === 2 && (!otp || otp.length !== 6 || timeLeft === 0))}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {step === 1 && "Send OTP"}
                                {step === 2 && "Verify & Complete Registration"}
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