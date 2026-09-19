import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeOnboarding } from "../../services/business.api";
import { motion } from "framer-motion";
import { Store, Building, MapPin, CheckCircle } from "lucide-react";

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    tradeName: "",
    businessType: "RETAIL",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await completeOnboarding(form);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to complete business setup."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border mb-2">
              <Store className="w-8 h-8 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Setup Your Business</h1>
            <p className="text-muted-foreground text-sm">
              Configure your store details to get your point-of-sale ready
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Business Legal Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Acme Retail Pvt Ltd"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Trade / Store Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    name="tradeName"
                    value={form.tradeName}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Acme Store"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Shop No. 12, Market Complex"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  City
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="input"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  State
                </label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="input"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Pincode
                </label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="input"
                  placeholder="110001"
                />
              </div>
            </div>

            {error && (
              <div className="alert border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-4"
            >
              {loading ? (
                "Saving..."
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Complete Setup & Open Dashboard
                </span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
