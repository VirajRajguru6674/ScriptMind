import { useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowLeft, CreditCard, ShieldCheck, Zap, ChevronsUpDown, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cities } from 'indian-cities-json';
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

interface City {
    id: string;
    name: string;
    state: string;
}

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [isSuccess, setIsSuccess] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [openState, setOpenState] = useState(false);
    const [openCity, setOpenCity] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        postalCode: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;

        if (name === "postalCode") {
            value = value.replace(/\D/g, "");
            if (value.length > 6) {
                value = value.slice(0, 6);
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateBilling = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email address";
        }

        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.postalCode.trim()) {
            newErrors.postalCode = "Postal code is required";
        } else if (!/^\d{6}$/.test(formData.postalCode)) {
            newErrors.postalCode = "Invalid postal code (6 digits)";
        }

        if (!selectedState) newErrors.state = "State is required";
        if (!selectedCity) newErrors.city = "City is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateBilling()) {
            setDirection(1);
            setStep(2);
        }
    };

    const handlePrevStep = () => {
        setDirection(-1);
        setStep(1);
    };

    // Process cities data to get unique states and cities map
    const { indianStates, cityMap } = useMemo(() => {
        const citiesList = cities as unknown as City[];
        if (!Array.isArray(citiesList)) return { indianStates: [], cityMap: {} };

        const uniqueStates: string[] = Array.from(new Set(citiesList.map((c) => c.state))).sort();
        const cityMapData: Record<string, string[]> = {};

        citiesList.forEach((c) => {
            if (!cityMapData[c.state]) {
                cityMapData[c.state] = [];
            }
            cityMapData[c.state].push(c.name);
        });

        Object.keys(cityMapData).forEach(state => {
            cityMapData[state].sort();
        });

        return { indianStates: uniqueStates, cityMap: cityMapData };
    }, []);

    // Get plan details from URL params or state
    const queryParams = new URLSearchParams(location.search);
    const planTitle = queryParams.get('plan') || 'Professional';
    const price = queryParams.get('price') || '29';
    const interval = queryParams.get('interval') || 'month';

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate payment process
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);

            // Redirect after showing success animation
            setTimeout(() => {
                navigate('/');
            }, 3500);
        }, 2000);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <>
            <Helmet>
                <title>Checkout - ScriptMind</title>
            </Helmet>

            <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative overflow-hidden">
                <Sidebar />
                <main className="lg:pl-[280px] relative z-10 transition-all duration-300">
                    <div className="container py-8 lg:py-12 max-w-6xl mx-auto">

                        {/* Success Popup Overlay */}
                        <AnimatePresence>
                            {isSuccess && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
                                >
                                    <div className="text-center space-y-6 max-w-md w-full p-8 rounded-3xl bg-card border border-border/50 shadow-2xl">
                                        <div className="flex justify-center">
                                            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center relative">
                                                <motion.svg
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="size-12 text-primary"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <motion.path
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                                                        d="M20 6L9 17l-5-5"
                                                    />
                                                </motion.svg>
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1.5, opacity: 0 }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-full border-2 border-primary"
                                                />
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                                            <p className="text-muted-foreground">
                                                Thank you for subscribing to the {planTitle} plan.
                                                <br />
                                                Redirecting to dashboard...
                                            </p>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-4 mb-8">
                            <Link to="/pricing">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Checkout</h1>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                            {/* Wizard Section */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Step Indicator */}
                                <div className="relative flex justify-between w-full max-w-sm mx-auto mb-10">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: "0%" }}
                                            animate={{ width: step === 1 ? "0%" : "100%" }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => step > 1 && handlePrevStep()}>
                                        <motion.div
                                            animate={{
                                                scale: step >= 1 ? 1 : 0.9,
                                                borderColor: step >= 1 ? "var(--primary)" : "var(--border)",
                                                backgroundColor: step >= 1 ? "var(--background)" : "var(--muted)"
                                            }}
                                            className={`size-10 rounded-full flex items-center justify-center border-4 z-10 transition-colors ${step >= 1 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}
                                        >
                                            1
                                        </motion.div>
                                        <span className={`text-xs font-semibold ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Billing</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <motion.div
                                            animate={{
                                                scale: step >= 2 ? 1 : 0.9,
                                                borderColor: step >= 2 ? "var(--primary)" : "var(--border)",
                                                backgroundColor: step >= 2 ? "var(--background)" : "var(--muted)"
                                            }}
                                            className={`size-10 rounded-full flex items-center justify-center border-4 z-10 transition-colors ${step >= 2 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}
                                        >
                                            2
                                        </motion.div>
                                        <span className={`text-xs font-semibold ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Payment</span>
                                    </div>
                                </div>

                                <div className="relative overflow-visible">
                                    <AnimatePresence initial={false} mode="wait" custom={direction}>
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                custom={direction}
                                                variants={variants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                                className="w-full"
                                            >
                                                <Card className="border-border/50 shadow-xl overflow-hidden backdrop-blur-sm bg-card/80">
                                                    <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                                                        <CardTitle className="flex items-center gap-2 text-xl">
                                                            <div className="p-2 bg-primary/10 rounded-md">
                                                                <CreditCard className="size-5 text-primary" />
                                                            </div>
                                                            Billing Address
                                                        </CardTitle>
                                                        <CardDescription>Enter your complete billing details to proceed</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pt-8 space-y-6">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                            <div className="space-y-2">
                                                                <Label className={errors.firstName ? "text-destructive" : ""}>First Name <span className="text-red-500">*</span></Label>
                                                                <Input
                                                                    name="firstName"
                                                                    value={formData.firstName}
                                                                    onChange={handleInputChange}
                                                                    placeholder="John"
                                                                    className={`h-11 ${errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                                />
                                                                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className={errors.lastName ? "text-destructive" : ""}>Last Name <span className="text-red-500">*</span></Label>
                                                                <Input
                                                                    name="lastName"
                                                                    value={formData.lastName}
                                                                    onChange={handleInputChange}
                                                                    placeholder="Doe"
                                                                    className={`h-11 ${errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                                />
                                                                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className={errors.email ? "text-destructive" : ""}>Email Address <span className="text-red-500">*</span></Label>
                                                            <Input
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                placeholder="john@example.com"
                                                                type="email"
                                                                className={`h-11 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                            />
                                                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className={errors.address ? "text-destructive" : ""}>Street Address <span className="text-red-500">*</span></Label>
                                                            <Input
                                                                name="address"
                                                                value={formData.address}
                                                                onChange={handleInputChange}
                                                                placeholder="123 Main St, Apt 4B"
                                                                className={`h-11 ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                            />
                                                            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                            <div className="space-y-2">
                                                                <Label className={errors.state ? "text-destructive" : ""}>State / Province <span className="text-red-500">*</span></Label>
                                                                <Popover open={openState} onOpenChange={setOpenState}>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            aria-expanded={openState}
                                                                            className={cn(
                                                                                "w-full justify-between font-normal h-11",
                                                                                errors.state ? "border-destructive hover:bg-destructive/10 text-destructive" : ""
                                                                            )}
                                                                        >
                                                                            {selectedState
                                                                                ? indianStates.find((state) => state === selectedState)
                                                                                : "Select State"}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[240px] p-0" align="start">
                                                                        <Command>
                                                                            <CommandInput placeholder="Search state..." />
                                                                            <CommandList>
                                                                                <CommandEmpty>No state found.</CommandEmpty>
                                                                                <CommandGroup className="max-h-[200px] overflow-auto">
                                                                                    {indianStates.map((state) => (
                                                                                        <CommandItem
                                                                                            key={state}
                                                                                            value={state}
                                                                                            onSelect={() => {
                                                                                                setSelectedState(state);
                                                                                                setSelectedCity("");
                                                                                                setOpenState(false);
                                                                                                setErrors(prev => ({ ...prev, state: "" }));
                                                                                            }}
                                                                                        >
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    "mr-2 h-4 w-4",
                                                                                                    selectedState === state ? "opacity-100" : "opacity-0"
                                                                                                )}
                                                                                            />
                                                                                            {state}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                                {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className={errors.city ? "text-destructive" : ""}>City <span className="text-red-500">*</span></Label>
                                                                <Popover open={openCity} onOpenChange={setOpenCity}>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            aria-expanded={openCity}
                                                                            disabled={!selectedState}
                                                                            className={cn(
                                                                                "w-full justify-between font-normal h-11",
                                                                                errors.city ? "border-destructive hover:bg-destructive/10 text-destructive" : ""
                                                                            )}
                                                                        >
                                                                            {selectedCity
                                                                                ? selectedCity
                                                                                : "Select City"}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[240px] p-0" align="start">
                                                                        <Command>
                                                                            <CommandInput placeholder="Search city..." />
                                                                            <CommandList>
                                                                                <CommandEmpty>No city found.</CommandEmpty>
                                                                                <CommandGroup className="max-h-[200px] overflow-auto">
                                                                                    {(selectedState && cityMap[selectedState as keyof typeof cityMap] || []).map((city) => (
                                                                                        <CommandItem
                                                                                            key={city}
                                                                                            value={city}
                                                                                            onSelect={() => {
                                                                                                setSelectedCity(city);
                                                                                                setOpenCity(false);
                                                                                                setErrors(prev => ({ ...prev, city: "" }));
                                                                                            }}
                                                                                        >
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    "mr-2 h-4 w-4",
                                                                                                    selectedCity === city ? "opacity-100" : "opacity-0"
                                                                                                )}
                                                                                            />
                                                                                            {city}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                            <div className="space-y-2">
                                                                <Label className={errors.postalCode ? "text-destructive" : ""}>Postal / Zip Code <span className="text-red-500">*</span></Label>
                                                                <Input
                                                                    name="postalCode"
                                                                    value={formData.postalCode}
                                                                    onChange={handleInputChange}
                                                                    placeholder="110001"
                                                                    maxLength={6}
                                                                    inputMode="numeric"
                                                                    className={`h-11 ${errors.postalCode ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                                />
                                                                {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Country <span className="text-red-500">*</span></Label>
                                                                <Input value="India" readOnly className="h-11 bg-muted cursor-not-allowed font-medium" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                    <CardFooter className="pt-6 border-t border-border/50 bg-muted/10">
                                                        <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={handleNextStep}>
                                                            Next: Payment Method
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                custom={direction}
                                                variants={variants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                                className="w-full"
                                            >
                                                <Card className="border-border/50 shadow-xl overflow-hidden backdrop-blur-sm bg-card/80">
                                                    <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                                <div className="p-2 bg-primary/10 rounded-md">
                                                                    <Wallet className="size-5 text-primary" />
                                                                </div>
                                                                Payment Method
                                                            </CardTitle>
                                                            <Button variant="ghost" size="sm" onClick={handlePrevStep} className="text-xs hover:bg-background/80">
                                                                Edit Billing
                                                            </Button>
                                                        </div>
                                                        <CardDescription>Select your preferred payment method to secure subscription</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pt-8 space-y-8">
                                                        {/* Payment Method Selection */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                            {[
                                                                { id: 'card', icon: CreditCard, label: 'Card' },
                                                                { id: 'upi', icon: Zap, label: 'UPI' },
                                                                { id: 'netbanking', icon: Check, label: 'Net Banking' },
                                                                { id: 'wallet', icon: Wallet, label: 'Wallet' }
                                                            ].map((method) => {
                                                                const Icon = method.icon;
                                                                return (
                                                                    <div
                                                                        key={method.id}
                                                                        onClick={() => setPaymentMethod(method.id)}
                                                                        className={`relative cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 
                                                                            ${paymentMethod === method.id
                                                                                ? 'border-primary bg-primary/5 shadow-inner ring-1 ring-primary/20'
                                                                                : 'border-border hover:bg-muted/50 hover:border-primary/30 hover:scale-[1.02]'
                                                                            }`}
                                                                    >
                                                                        {paymentMethod === method.id && (
                                                                            <div className="absolute top-2 right-2 size-2 rounded-full bg-primary animate-pulse" />
                                                                        )}
                                                                        <Icon className={`size-6 ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                                        <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`}>{method.label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Dynamic Payment Details */}
                                                        <div className="min-h-[250px] relative">
                                                            <AnimatePresence mode="wait">
                                                                {paymentMethod === 'card' && (
                                                                    <motion.div
                                                                        key="card"
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -10 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="space-y-6"
                                                                    >
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="card-name">Cardholder Name</Label>
                                                                            <Input id="card-name" placeholder="John Doe" className="h-11" />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="card-number">Card Number</Label>
                                                                            <div className="relative">
                                                                                <Input id="card-number" placeholder="0000 0000 0000 0000" className="pl-11 h-11 font-mono" />
                                                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-6">
                                                                            <div className="grid gap-2">
                                                                                <Label htmlFor="expiry">Expiry Date</Label>
                                                                                <Input id="expiry" placeholder="MM/YY" className="h-11" />
                                                                            </div>
                                                                            <div className="grid gap-2">
                                                                                <Label htmlFor="cvc">CVC</Label>
                                                                                <Input id="cvc" placeholder="123" type="password" className="h-11" />
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                {paymentMethod === 'upi' && (
                                                                    <motion.div
                                                                        key="upi"
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -10 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="space-y-6"
                                                                    >
                                                                        <div className="space-y-3">
                                                                            <Label>Pay using App</Label>
                                                                            <div className="grid grid-cols-3 gap-4">
                                                                                {[
                                                                                    { id: 'gpay', name: 'Google Pay', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo_%282020%29.svg' },
                                                                                    { id: 'phonepe', name: 'PhonePe', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg' },
                                                                                    { id: 'amazon', name: 'Amazon Pay', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Amazon_Pay_logo.svg' }
                                                                                ].map((app) => (
                                                                                    <div
                                                                                        key={app.id}
                                                                                        onClick={() => setSelectedUpiApp(app.id)}
                                                                                        title={app.name}
                                                                                        className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-0 transition-all duration-200 shadow-sm hover:shadow-md h-24 bg-card
                                                                                            ${selectedUpiApp === app.id
                                                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 scale-[1.02]'
                                                                                                : 'border-muted hover:border-primary/30 hover:bg-muted/30'
                                                                                            }`}
                                                                                    >
                                                                                        <div className="h-full w-full flex items-center justify-center p-2">
                                                                                            <img
                                                                                                src={app.logo}
                                                                                                alt={app.name}
                                                                                                className="w-full h-full object-contain"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        <div className="relative py-2">
                                                                            <div className="absolute inset-0 flex items-center">
                                                                                <span className="w-full border-t border-dashed" />
                                                                            </div>
                                                                            <div className="relative flex justify-center text-xs uppercase">
                                                                                <span className="bg-card px-3 text-muted-foreground font-medium">Or enter UPI ID</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="upi-id">UPI ID / VPA</Label>
                                                                            <div className="relative">
                                                                                <Input id="upi-id" placeholder="username@upi" className="pl-11 h-11" />
                                                                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                {(paymentMethod === 'netbanking' || paymentMethod === 'wallet') && (
                                                                    <motion.div
                                                                        key="other"
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="flex flex-col items-center justify-center py-12 text-center h-full"
                                                                    >
                                                                        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 ring-1 ring-border">
                                                                            {paymentMethod === 'netbanking' ? <Check className="size-8 text-muted-foreground" /> : <Wallet className="size-8 text-muted-foreground" />}
                                                                        </div>
                                                                        <h3 className="font-semibold text-lg text-foreground mb-1">Coming Soon</h3>
                                                                        <p className="text-sm text-muted-foreground max-w-[250px]">
                                                                            {paymentMethod === 'netbanking' ? 'Net Banking' : 'Wallet'} integration is currently under maintenance.
                                                                        </p>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                                            <div className="p-2 bg-background rounded-full border border-primary/20">
                                                                <ShieldCheck className="size-5 text-primary" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-foreground">Secure Payment</p>
                                                                <p className="text-xs text-muted-foreground">Your financial data is encrypted and secure.</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                    <CardFooter className="pt-6 border-t border-border/50 bg-muted/10 flex gap-4">
                                                        <Button variant="outline" onClick={handlePrevStep} className="h-12 w-24">Back</Button>
                                                        <Button
                                                            className="flex-1 h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                                                            onClick={handleCheckout}
                                                            disabled={isLoading || (paymentMethod === 'netbanking' || paymentMethod === 'wallet')}
                                                        >
                                                            {isLoading ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="size-5 animate-spin" />
                                                                    Processing...
                                                                </div>
                                                            ) : `Pay ₹${price} & Activate`}
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Order Summary Sidebar */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="sticky top-24">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl relative overflow-hidden ring-1 ring-border">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <CreditCard className="size-4 text-primary" />
                                                    Order Summary
                                                </CardTitle>
                                                <CardDescription>Review subscription details</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="flex items-start justify-between pb-4 border-b border-border/50">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-lg">{planTitle} Plan</p>
                                                        <p className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full inline-block">Billed {interval}ly</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-xl">₹{price}</p>
                                                        <p className="text-[10px] text-muted-foreground">/{interval.slice(0, 3)}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Included Features:</p>
                                                    <ul className="space-y-3">
                                                        {[
                                                            "Unlimited AI Summaries",
                                                            "Full Playlist History",
                                                            "Priority Export (PDF/MD)",
                                                            "No Ads Architecture"
                                                        ].map((feat) => (
                                                            <li key={feat} className="flex items-start gap-3 text-sm group">
                                                                <div className="mt-0.5 p-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                    <Check className="size-3" />
                                                                </div>
                                                                <span className="text-foreground/90">{feat}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-primary/5 border-t border-primary/10 py-5">
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="space-y-0.5">
                                                        <span className="font-bold text-lg">Total Due</span>
                                                        <p className="text-xs text-muted-foreground">Including taxes</p>
                                                    </div>
                                                    <span className="text-3xl font-black text-primary tracking-tight">₹{price}</span>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50 text-center space-y-2"
                                    >
                                        <p className="text-xs text-muted-foreground">Need help?</p>
                                        <p className="text-sm font-medium">support@scriptmind.com</p>
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </>
    );
};

// Simple Wallet Icon Component since it might be missing in lucide import
const Wallet = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
);

export default Checkout;
