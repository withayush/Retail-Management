import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBusiness } from "../../services/business.api";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Store,
  Info
} from "lucide-react";

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const { refreshBusinessStatus } = useAuth();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    category: "",
    description: "",
    businessEmail: "",
    businessPhone: "",
    whatsappNumber: "",
    website: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await createBusiness(formData);
      console.log("Business Created Successfully:", response);
      
      // Refresh business status in AuthContext
      await refreshBusinessStatus();
      
      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Onboarding Error:", err);
      setError(
        err.response?.data?.message || "Failed to create business profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: Store, title: "Basic Info", subtitle: "Tell us about your business" },
    { icon: Phone, title: "Contact", subtitle: "How can customers reach you" },
    { icon: MapPin, title: "Address", subtitle: "Where is your business located" },
    { icon: Globe, title: "Additional", subtitle: "Extra business details" },
    { icon: CheckCircle, title: "Review", subtitle: "Confirm everything is correct" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Set Up Your Business</h1>
            <p className="text-muted-foreground mt-2">
              Step {step} of 5: {steps[step - 1].title}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/50 rounded-full h-2 mb-8">
            <motion.div
              initial={{ width: `${((step - 1) / 4) * 100}%` }}
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full gradient-primary"
            />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            {steps.map((s, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index + 1 === step
                      ? "gradient-primary text-white shadow-lg shadow-primary/25"
                      : index + 1 < step
                      ? "bg-accent text-white"
                      : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  {index + 1 < step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {step === 1 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Name *
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="Sharma Sweets"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Type *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="Retail, Food, Services, etc."
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Category
                      </label>
                      <div className="relative">
                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="Sweet Shop, Bakery, etc."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground resize-none"
                        placeholder="Tell us about your business..."
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessEmail"
                          type="email"
                          value={formData.businessEmail}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="contact@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Phone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="businessPhone"
                          value={formData.businessPhone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="9876543210"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        WhatsApp Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Business Address</h3>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Street Address *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="addressLine"
                          value={formData.addressLine}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                          placeholder="MI Road, Jaipur"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        City *
                      </label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        placeholder="Jaipur"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        State *
                      </label>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        placeholder="Rajasthan"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Pincode *
                      </label>
                      <input
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                        placeholder="302001"
                        required
                      />
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                    <div className="p-6 glass rounded-xl">
                      <p className="text-sm text-muted-foreground mb-4">
                        You can add legal documents and other details later. For now, let&apos;s get your business set up!
                      </p>
                      <div className="space-y-4">
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                          <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
                          <p className="text-sm text-foreground/50">Will be added later</p>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                          <p className="text-sm font-medium text-muted-foreground">PAN Number</p>
                          <p className="text-sm text-foreground/50">Will be added later</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Review Your Details</h3>
                    <div className="p-6 glass rounded-xl space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Business Name</span>
                        <span className="font-medium text-right">{formData.businessName || "-"}</span>
                        
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium text-right">{formData.businessType || "-"}</span>
                        
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium text-right">{formData.category || "General"}</span>
                        
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium text-right">{formData.businessEmail || "-"}</span>
                        
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium text-right">{formData.businessPhone || "-"}</span>
                        
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium text-right">
                          {formData.addressLine || "-"}<br />
                          {formData.city && `${formData.city}, `}
                          {formData.state && `${formData.state} - `}
                          {formData.pincode || ""}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary/70 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-success text-white hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
