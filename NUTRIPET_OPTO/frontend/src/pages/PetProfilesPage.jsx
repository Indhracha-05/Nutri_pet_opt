import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Stethoscope,
  Utensils,
  CheckCircle,
  AlertTriangle,
  Heart,
  Activity,
  Sparkles,
  Clock,
  ArrowLeft,
  Pill,
  DollarSign,
  MapPin,
  User,
  ChevronRight,
  Scale,
  ShieldAlert,
  Award,
  Download,
  Bell
} from 'lucide-react';
import NotificationCenter from '../components/NotificationCenter';
import { openGoogleCalendarLink, downloadIcsFile } from '../utils/calendarExport';

const API_BASE = "http://localhost:8000";

const EMOJI_OPTIONS = ["🐕", "🐩", "🐈", "🐈‍⬛", "🐇", "🦜", "🐹", "🐢", "🐟", "🐎", "🐾"];
const ACTIVITY_OPTIONS = [
  { value: "inactive", label: "Inactive", desc: "Sedentary / senior" },
  { value: "normal", label: "Normal", desc: "Standard household activity" },
  { value: "active", label: "Active", desc: "High exercise / playful" },
  { value: "working", label: "Working", desc: "Sporting / working dog" },
];
const DIET_TYPES = ["Raw", "Wet Food", "Dry Kibble", "Home-Cooked", "Prescription", "Mixed"];
const COMMON_VISIT_REASONS = [
  "Annual Wellness & Vaccines",
  "Rabies Booster",
  "Dental Scale & Polish",
  "Digestive Assessment",
  "Weight Check & Dietary Review",
  "Dermatology / Allergy Exam",
  "Post-Op Follow-up",
];

export default function PetProfilesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Core Data
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [petDetail, setPetDetail] = useState(null);
  const [speciesList, setSpeciesList] = useState([]);
  const [availableFoods, setAvailableFoods] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState("diets"); // "diets" | "vet" | "safety"
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals: { type: null | 'addPet' | 'editPet' | 'addDiet' | 'editDiet' | 'addVisit' | 'editVisit', data: null }
  const [modal, setModal] = useState({ type: null, data: null });

  // Quick Safety Check State for selected pet
  const [safetyFood, setSafetyFood] = useState("");
  const [safetyResult, setSafetyResult] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load pets and species
  const loadPets = async (selectId = null) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/pets`);
      setPets(res.data);

      const targetId = selectId || (res.data.length > 0 ? res.data[0].pet_id : null);
      if (targetId) {
        setSelectedPetId(targetId);
        loadPetDetail(targetId);
      } else {
        setPetDetail(null);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load pet profiles");
    } finally {
      setLoading(false);
    }
  };

  const loadPetDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await axios.get(`${API_BASE}/pets/${id}`);
      setPetDetail(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load pet details");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const requestedPetId = searchParams.get("petId");
    loadPets(requestedPetId ? parseInt(requestedPetId) : null);

    axios.get(`${API_BASE}/species`).then((r) => setSpeciesList(r.data)).catch(() => {});
    axios.get(`${API_BASE}/foods`).then((r) => setAvailableFoods(r.data)).catch(() => {});
  }, []);

  const handleSelectPet = (id) => {
    setSelectedPetId(id);
    loadPetDetail(id);
    setSafetyResult(null);
    setSafetyFood("");
  };

  // ── Pet CRUD ─────────────────────────────────────────────────────────────
  const handleSavePet = async (formData) => {
    try {
      if (modal.type === "editPet") {
        await axios.put(`${API_BASE}/pets/${selectedPetId}`, formData);
        showToast("Pet profile updated successfully");
      } else {
        const res = await axios.post(`${API_BASE}/pets`, formData);
        showToast("New pet profile registered!");
        setSelectedPetId(res.data.pet_id);
      }
      setModal({ type: null, data: null });
      loadPets(modal.type === "editPet" ? selectedPetId : null);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Error saving pet profile");
    }
  };

  const handleDeletePet = async (petId, name) => {
    if (!window.confirm(`Are you sure you want to delete profile for "${name}"? This removes all associated diets and vet records.`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/pets/${petId}`);
      showToast(`Profile for ${name} deleted`);
      loadPets();
    } catch (err) {
      console.error(err);
      showToast("Error deleting pet profile");
    }
  };

  // ── Diet CRUD ────────────────────────────────────────────────────────────
  const handleSaveDiet = async (formData) => {
    try {
      if (modal.type === "editDiet") {
        await axios.put(`${API_BASE}/pets/${selectedPetId}/diets/${modal.data.diet_id}`, formData);
        showToast("Diet updated successfully");
      } else {
        await axios.post(`${API_BASE}/pets/${selectedPetId}/diets`, formData);
        showToast("New diet regimen saved!");
      }
      setModal({ type: null, data: null });
      loadPetDetail(selectedPetId);
      // Refresh summary list so active diet name updates
      const res = await axios.get(`${API_BASE}/pets`);
      setPets(res.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Error saving diet");
    }
  };

  const handleToggleDietActive = async (diet) => {
    try {
      await axios.put(`${API_BASE}/pets/${selectedPetId}/diets/${diet.diet_id}`, {
        ...diet,
        is_active: !diet.is_active,
      });
      showToast(diet.is_active ? "Diet marked as inactive" : "Diet set as Current Active Regimen");
      loadPetDetail(selectedPetId);
      const res = await axios.get(`${API_BASE}/pets`);
      setPets(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to update diet status");
    }
  };

  const handleDeleteDiet = async (dietId) => {
    if (!window.confirm("Delete this diet regimen?")) return;
    try {
      await axios.delete(`${API_BASE}/pets/${selectedPetId}/diets/${dietId}`);
      showToast("Diet deleted");
      loadPetDetail(selectedPetId);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete diet");
    }
  };

  // ── Vet Visit CRUD ───────────────────────────────────────────────────────
  const handleSaveVisit = async (formData) => {
    try {
      if (modal.type === "editVisit") {
        await axios.put(`${API_BASE}/pets/${selectedPetId}/vet-visits/${modal.data.visit_id}`, formData);
        showToast("Vet visit record updated");
      } else {
        await axios.post(`${API_BASE}/pets/${selectedPetId}/vet-visits`, formData);
        showToast("Veterinary visit logged successfully!");
      }
      setModal({ type: null, data: null });
      loadPetDetail(selectedPetId);
      const res = await axios.get(`${API_BASE}/pets`);
      setPets(res.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Error saving vet visit");
    }
  };

  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm("Delete this veterinary visit entry?")) return;
    try {
      await axios.delete(`${API_BASE}/pets/${selectedPetId}/vet-visits/${visitId}`);
      showToast("Visit record deleted");
      loadPetDetail(selectedPetId);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete visit record");
    }
  };

  // ── Safety Quick Test ─────────────────────────────────────────────────────
  const handleCheckSafety = async () => {
    if (!safetyFood || !petDetail) return;
    setSafetyLoading(true);
    setSafetyResult(null);
    try {
      const res = await axios.post(`${API_BASE}/analyze`, {
        species_name: petDetail.species_name,
        food_name: safetyFood,
      });
      setSafetyResult(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to test ingredient safety");
    } finally {
      setSafetyLoading(false);
    }
  };

  const activeDiet = petDetail?.diets?.find((d) => d.is_active);
  const inactiveDiets = petDetail?.diets?.filter((d) => !d.is_active) || [];
  const nextVisit = petDetail?.vet_visits?.find((v) => v.next_visit_date);

  const getVisitUrgency = (dateStr) => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: 'overdue', text: `Overdue (${Math.abs(diffDays)}d ago)`, days: diffDays };
      if (diffDays === 0) return { status: 'today', text: 'Scheduled Today', days: 0 };
      if (diffDays <= 7) return { status: 'soon', text: `In ${diffDays} days`, days: diffDays };
      return { status: 'future', text: `In ${diffDays} days`, days: diffDays };
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#17191c] flex flex-col justify-between selection:bg-[#fbe1d1] selection:text-[#5d2a1a]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#17191c] text-white px-5 py-3 rounded-full text-xs shadow-xl flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#fbe1d1]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="border-b border-[#ececec] bg-[#ffffff] sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-[1240px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-sans text-[#777b86] hover:text-[#17191c] transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <div className="h-4 w-px bg-[#ececec]" />
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl text-[#17191c] tracking-tight">NutriPet</span>
              <span className="text-xs bg-[#f2f2f3] text-[#777b86] px-2 py-0.5 rounded-full font-mono">
                Clinical Care
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/analyzer')}
              className="px-4 py-2 text-xs font-sans rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors"
            >
              Food Safety & AI
            </button>
            <button
              onClick={() => navigate('/analyzer?tab=planner')}
              className="px-4 py-2 text-xs font-sans rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors"
            >
              Smart Meal Planner
            </button>

            <NotificationCenter />

            <button
              onClick={() => setModal({ type: 'addPet', data: null })}
              className="btn-pill-filled text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Pet Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1240px] mx-auto px-8 py-10 flex-1 w-full space-y-10">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#ececec] pb-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-[#777b86] font-medium">
              Multi-Pet Health & Nutritional Registry
            </span>
            <h1 className="text-3xl md:text-4xl font-serif text-[#17191c]">
              Pet Profiles, Diets & Clinical Records
            </h1>
          </div>
          <div className="text-xs text-[#777b86] max-w-sm leading-relaxed">
            Personalized resting and maintenance energy (RER / MER) calculations, active feeding protocols, and full veterinary timelines.
          </div>
        </div>

        {/* Pet Carousel Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[#777b86]">
            <span>Select Registered Pet ({pets.length})</span>
            <span>Click pet card to view details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pets.map((p) => {
              const isSelected = p.pet_id === selectedPetId;
              return (
                <div
                  key={p.pet_id}
                  onClick={() => handleSelectPet(p.pet_id)}
                  className={`p-4 rounded-cards transition-all cursor-pointer relative border flex flex-col justify-between min-h-[140px] ${
                    isSelected
                      ? "bg-[#fafafb] border-[#17191c] shadow-sm ring-1 ring-[#17191c]"
                      : "bg-[#ffffff] border-[#ececec] hover:border-[#a3a6af] hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#fbe1d1]/50 border border-[#fbe1d1] flex items-center justify-center text-2xl shadow-inner">
                        {p.avatar_emoji || "🐾"}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-medium text-[#17191c] leading-tight flex items-center gap-1.5">
                          {p.name}
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#17191c]" />}
                        </h3>
                        <p className="text-xs text-[#777b86]">
                          {p.species_name} {p.breed ? `• ${p.breed}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#ececec]/80 mt-2 flex items-center justify-between text-xs">
                    <div className="text-[#17191c] font-mono">
                      {p.weight_kg} kg <span className="text-[#a3a6af]">({p.mer_kcal} kcal)</span>
                    </div>
                    <span className="text-[11px] bg-[#f2f2f3] px-2 py-0.5 rounded-full text-[#777b86]">
                      {p.diet_count} {p.diet_count === 1 ? 'diet' : 'diets'} • {p.vet_visit_count} visits
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Pet Card */}
            <div
              onClick={() => setModal({ type: 'addPet', data: null })}
              className="p-4 rounded-cards border-2 border-dashed border-[#ececec] hover:border-[#17191c] bg-[#fafafb]/50 hover:bg-[#fafafb] transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 min-h-[140px] text-[#777b86] hover:text-[#17191c]"
            >
              <div className="w-9 h-9 rounded-full bg-[#ffffff] border border-[#ececec] flex items-center justify-center text-[#17191c]">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">Add New Pet Profile</span>
            </div>
          </div>
        </section>

        {/* Active Pet Workspace */}
        {loading && (
          <div className="p-16 text-center text-[#777b86] space-y-3">
            <div className="w-8 h-8 border-2 border-[#ececec] border-t-[#17191c] rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading pet medical and dietary records...</p>
          </div>
        )}

        {!loading && petDetail && (
          <div className="space-y-8 animate-fade-in">
            {/* ── Pet Hero Clinical Card ───────────────────────────────────── */}
            <div className="card-floating p-6 md:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left: Identity */}
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#fbe1d1]/50 border border-[#fbe1d1] flex items-center justify-center text-5xl shadow-sm shrink-0">
                    {petDetail.avatar_emoji || "🐾"}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-3xl md:text-4xl font-serif text-[#17191c]">
                        {petDetail.name}
                      </h2>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#17191c] text-white">
                        {petDetail.species_name}
                      </span>
                      {petDetail.activity_level && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-sans bg-[#f2f2f3] text-[#777b86] capitalize">
                          {petDetail.activity_level} Activity
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#777b86]">
                      {petDetail.breed || "Standard breed"} • {petDetail.age_years ? `${petDetail.age_years} years old` : "Age not specified"} • Weight: <span className="font-mono text-[#17191c] font-medium">{petDetail.weight_kg} kg</span>
                    </p>

                    {/* Allergies and Sensitivities Tag */}
                    {petDetail.allergies_sensitivities && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-xs font-medium text-[#5d2a1a] flex items-center gap-1 bg-[#fbe1d1] px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Sensitivities: {petDetail.allergies_sensitivities}</span>
                        </span>
                      </div>
                    )}

                    {petDetail.medical_notes && (
                      <p className="text-xs text-[#777b86] italic max-w-xl pt-1">
                        "{petDetail.medical_notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/analyzer?tab=planner&petWeight=${petDetail.weight_kg}&species=${petDetail.species_name}&activity=${petDetail.activity_level}`)}
                    className="btn-pill-filled text-xs flex items-center gap-1.5"
                  >
                    <Utensils className="w-3.5 h-3.5 text-[#fbe1d1]" />
                    <span>Generate Meal Plan</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModal({ type: 'editPet', data: petDetail })}
                      className="px-3 py-2 rounded-full border border-[#ececec] text-xs font-medium text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb] transition-all flex items-center gap-1.5 flex-1 justify-center"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => handleDeletePet(petDetail.pet_id, petDetail.name)}
                      className="px-3 py-2 rounded-full border border-[#ececec] text-xs font-medium text-[#a3a6af] hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-all flex items-center gap-1.5"
                      title="Delete Pet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Metabolic Calibrations Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-inputs bg-[#fafafb] border border-[#ececec]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#979799] block">
                    Resting Energy (RER)
                  </span>
                  <div className="text-lg font-mono font-medium text-[#17191c]">
                    {petDetail.rer_kcal} <span className="text-xs text-[#777b86] font-sans">kcal/day</span>
                  </div>
                  <span className="text-[10px] text-[#a3a6af]">Basal physiological need</span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#979799] block">
                    Target Maintenance (MER)
                  </span>
                  <div className="text-lg font-mono font-medium text-[#17191c] text-[#5d2a1a]">
                    {petDetail.mer_kcal} <span className="text-xs text-[#777b86] font-sans">kcal/day</span>
                  </div>
                  <span className="text-[10px] text-[#a3a6af]">{petDetail.activity_level} multiplier applied</span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#979799] block">
                    Active Feeding Plan
                  </span>
                  <div className="text-sm font-medium text-[#17191c] truncate">
                    {activeDiet ? activeDiet.diet_name : "None assigned"}
                  </div>
                  <span className="text-[10px] text-[#a3a6af]">
                    {activeDiet ? `${activeDiet.daily_calories_target || '—'} kcal • ${activeDiet.meals_per_day} meals` : "Add diet below"}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#979799] block">
                    Next Clinical Visit
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-[#17191c]">
                      {nextVisit?.next_visit_date || "None scheduled"}
                    </span>
                    {nextVisit?.next_visit_date && (() => {
                      const urgency = getVisitUrgency(nextVisit.next_visit_date);
                      if (!urgency) return null;
                      if (urgency.status === 'overdue') {
                        return <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Overdue</span>;
                      }
                      if (urgency.status === 'today') {
                        return <span className="text-[10px] font-semibold bg-[#5d2a1a] text-white px-2 py-0.5 rounded-full uppercase">Today</span>;
                      }
                      if (urgency.status === 'soon') {
                        return <span className="text-[10px] font-semibold bg-[#fbe1d1] text-[#5d2a1a] px-2 py-0.5 rounded-full">{urgency.text}</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#a3a6af]">
                      {petDetail.vet_visits.length} past record{petDetail.vet_visits.length === 1 ? '' : 's'}
                    </span>
                    {nextVisit?.next_visit_date && (
                      <button
                        onClick={() => openGoogleCalendarLink({
                          petName: petDetail.name,
                          reason: nextVisit.reason,
                          date: nextVisit.next_visit_date,
                          clinicName: nextVisit.clinic_name,
                          veterinarian: nextVisit.veterinarian,
                        })}
                        className="text-[10px] text-[#5d2a1a] hover:underline font-medium flex items-center gap-0.5"
                        title="Add to Google Calendar"
                      >
                        <Calendar className="w-2.5 h-2.5" /> Sync Cal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sub Navigation Tabs ───────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-[#ececec]">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab("diets")}
                  className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                    activeTab === "diets"
                      ? "text-[#17191c] font-semibold"
                      : "text-[#777b86] hover:text-[#17191c]"
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>Diets & Nutritional Regimens</span>
                  <span className="px-1.5 py-0.2 bg-[#f2f2f3] text-[11px] rounded-full text-[#777b86]">
                    {petDetail.diets?.length || 0}
                  </span>
                  {activeTab === "diets" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#17191c]" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("vet")}
                  className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                    activeTab === "vet"
                      ? "text-[#17191c] font-semibold"
                      : "text-[#777b86] hover:text-[#17191c]"
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Veterinary Care & Timeline</span>
                  <span className="px-1.5 py-0.2 bg-[#f2f2f3] text-[11px] rounded-full text-[#777b86]">
                    {petDetail.vet_visits?.length || 0}
                  </span>
                  {activeTab === "vet" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#17191c]" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("safety")}
                  className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                    activeTab === "safety"
                      ? "text-[#17191c] font-semibold"
                      : "text-[#777b86] hover:text-[#17191c]"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Food Compatibility Check</span>
                  {activeTab === "safety" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#17191c]" />
                  )}
                </button>
              </div>

              {/* Action Button for current tab */}
              {activeTab === "diets" && (
                <button
                  onClick={() => setModal({ type: 'addDiet', data: null })}
                  className="btn-pill-filled text-xs flex items-center gap-1.5 mb-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Diet</span>
                </button>
              )}

              {activeTab === "vet" && (
                <button
                  onClick={() => setModal({ type: 'addVisit', data: null })}
                  className="btn-pill-filled text-xs flex items-center gap-1.5 mb-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Vet Visit</span>
                </button>
              )}
            </div>

            {/* ── TAB 1: DIETS ────────────────────────────────────────────── */}
            {activeTab === "diets" && (
              <div className="space-y-6">
                {/* Active Diet Spotlight */}
                {activeDiet ? (
                  <div className="card-floating p-6 md:p-8 space-y-6 border-l-4 border-l-[#17191c]">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#17191c] text-white">
                            Current Active Regimen
                          </span>
                          <span className="text-xs text-[#777b86]">• {activeDiet.diet_type}</span>
                        </div>
                        <h3 className="text-2xl font-serif text-[#17191c]">
                          {activeDiet.diet_name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ type: 'editDiet', data: activeDiet })}
                          className="px-3 py-1.5 rounded-full border border-[#ececec] text-xs font-medium text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb] transition-all flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleDietActive(activeDiet)}
                          className="px-3 py-1.5 rounded-full border border-[#ececec] text-xs font-medium text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb] transition-all"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleDeleteDiet(activeDiet.diet_id)}
                          className="p-1.5 text-[#a3a6af] hover:text-red-600 transition-colors"
                          title="Delete Diet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Caloric & Schedule Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-inputs bg-[#fafafb] border border-[#ececec]">
                      <div>
                        <span className="text-xs text-[#777b86] block">Daily Energy Target</span>
                        <div className="text-lg font-mono font-medium text-[#17191c]">
                          {activeDiet.daily_calories_target || '—'} <span className="text-xs font-sans text-[#777b86]">kcal</span>
                        </div>
                        {activeDiet.daily_calories_target && (
                          <span className="text-[10px] text-[#a3a6af]">
                            {Math.round((activeDiet.daily_calories_target / (petDetail.mer_kcal || 1)) * 100)}% of recommended MER
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-xs text-[#777b86] block">Portion Frequency</span>
                        <div className="text-lg font-medium text-[#17191c]">
                          {activeDiet.meals_per_day || 2} meals/day
                        </div>
                        <span className="text-[10px] text-[#a3a6af]">Evenly divided portions</span>
                      </div>

                      <div>
                        <span className="text-xs text-[#777b86] block">Feeding Schedule</span>
                        <div className="text-sm font-medium text-[#17191c] pt-1">
                          {activeDiet.schedule_time || "Morning & Evening"}
                        </div>
                        <span className="text-[10px] text-[#a3a6af]">Routine adherence</span>
                      </div>
                    </div>

                    {/* Ingredients Breakdown Table */}
                    {activeDiet.ingredients_json && (() => {
                      try {
                        const ingredients = JSON.parse(activeDiet.ingredients_json);
                        if (Array.isArray(ingredients) && ingredients.length > 0) {
                          return (
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-[#17191c] uppercase tracking-wider block">
                                Recipe Composition & Portions
                              </span>
                              <div className="border border-[#ececec] rounded-inputs overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#fafafb] text-[#777b86] border-b border-[#ececec]">
                                    <tr>
                                      <th className="py-2.5 px-4 font-medium">Ingredient</th>
                                      <th className="py-2.5 px-4 font-medium">Category</th>
                                      <th className="py-2.5 px-4 font-medium text-right">Portion</th>
                                      <th className="py-2.5 px-4 font-medium text-right">Calories</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#ececec]">
                                    {ingredients.map((ing, i) => (
                                      <tr key={i} className="hover:bg-[#fafafb]/60 transition-colors">
                                        <td className="py-2.5 px-4 font-medium text-[#17191c]">{ing.food_name || ing.name}</td>
                                        <td className="py-2.5 px-4 text-[#777b86]">
                                          <span className="px-2 py-0.5 rounded-full bg-[#f2f2f3] text-[10px]">
                                            {ing.category || "Protein"}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-[#17191c]">
                                          {ing.grams}g
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono text-[#777b86]">
                                          {ing.calories ? `${Math.round(ing.calories)} kcal` : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        return (
                          <div className="text-xs text-[#777b86] bg-[#fafafb] p-3 rounded-inputs border border-[#ececec]">
                            {activeDiet.ingredients_json}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Notes */}
                    {activeDiet.notes && (
                      <div className="p-4 rounded-inputs bg-[#fafafb] border border-[#ececec] text-xs text-[#777b86] space-y-1">
                        <span className="font-medium text-[#17191c]">Preparation & Feeding Instructions:</span>
                        <p>{activeDiet.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 rounded-cards border-2 border-dashed border-[#ececec] text-center space-y-3 bg-[#fafafb]">
                    <Utensils className="w-8 h-8 text-[#a3a6af] mx-auto" />
                    <h4 className="font-serif text-lg text-[#17191c]">No Active Diet Assigned</h4>
                    <p className="text-xs text-[#777b86] max-w-sm mx-auto">
                      Create a tailored feeding regimen for {petDetail.name} or generate one with the smart optimizer.
                    </p>
                    <button
                      onClick={() => setModal({ type: 'addDiet', data: null })}
                      className="btn-pill-filled text-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Diet Protocol</span>
                    </button>
                  </div>
                )}

                {/* Inactive / Past Diets History */}
                {inactiveDiets.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-medium text-[#777b86] uppercase tracking-wider">
                      Alternative & Past Diets ({inactiveDiets.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inactiveDiets.map((d) => (
                        <div
                          key={d.diet_id}
                          className="p-5 rounded-cards border border-[#ececec] bg-[#ffffff] space-y-3 hover:border-[#a3a6af] transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] bg-[#f2f2f3] text-[#777b86] px-2 py-0.5 rounded-full font-medium">
                                {d.diet_type}
                              </span>
                              <h5 className="font-serif text-base text-[#17191c] mt-1 font-medium">
                                {d.diet_name}
                              </h5>
                              <p className="text-xs text-[#777b86] font-mono">
                                {d.daily_calories_target ? `${d.daily_calories_target} kcal` : 'Calorie target not set'} • {d.meals_per_day} meals/day
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleDietActive(d)}
                                className="px-2.5 py-1 rounded-full border border-[#17191c] text-[11px] font-medium text-[#17191c] hover:bg-[#17191c] hover:text-white transition-all"
                              >
                                Set as Active
                              </button>
                              <button
                                onClick={() => handleDeleteDiet(d.diet_id)}
                                className="p-1 text-[#a3a6af] hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {d.notes && (
                            <p className="text-xs text-[#777b86] line-clamp-2">
                              {d.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: VET VISITS ────────────────────────────────────────── */}
            {activeTab === "vet" && (
              <div className="space-y-6">
                {/* Upcoming Visit Reminder Alert */}
                {nextVisit && (() => {
                  const urgency = getVisitUrgency(nextVisit.next_visit_date);
                  const isOverdue = urgency?.status === 'overdue';
                  const isToday = urgency?.status === 'today';

                  return (
                    <div className={`p-5 rounded-cards border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isOverdue
                        ? 'bg-red-50/80 border-red-200'
                        : isToday
                        ? 'bg-[#fbe1d1]/50 border-[#5d2a1a]/30'
                        : 'bg-[#fbe1d1]/30 border-[#fbe1d1]'
                    }`}>
                      <div className="flex items-start md:items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                          isOverdue
                            ? 'bg-red-100 text-red-700'
                            : isToday
                            ? 'bg-[#5d2a1a] text-white'
                            : 'bg-[#fbe1d1] text-[#5d2a1a]'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${
                              isOverdue ? 'text-red-700' : 'text-[#5d2a1a]'
                            }`}>
                              {isOverdue ? '⚠️ Overdue Clinical Checkup' : isToday ? '🔔 Checkup Scheduled Today' : 'Upcoming Checkup Reminder'}
                            </span>
                            {urgency && (
                              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                isOverdue
                                  ? 'bg-red-200/80 text-red-900'
                                  : isToday
                                  ? 'bg-[#5d2a1a] text-white'
                                  : 'bg-[#fbe1d1] text-[#5d2a1a]'
                              }`}>
                                {urgency.text}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#17191c] mt-0.5">
                            Scheduled: <span className="font-serif font-bold text-base">{nextVisit.next_visit_date}</span> — {nextVisit.reason}
                          </p>
                          <p className="text-xs text-[#777b86]">
                            {nextVisit.clinic_name || "Oak Valley Animal Hospital"} {nextVisit.veterinarian ? `• ${nextVisit.veterinarian}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openGoogleCalendarLink({
                            petName: petDetail.name,
                            reason: nextVisit.reason,
                            date: nextVisit.next_visit_date,
                            clinicName: nextVisit.clinic_name,
                            veterinarian: nextVisit.veterinarian,
                          })}
                          className="btn-pill-filled text-xs py-1.5 px-3 flex items-center gap-1.5"
                          title="Add to Google Calendar with automatic reminder notification"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Google Calendar</span>
                        </button>
                        <button
                          onClick={() => downloadIcsFile({
                            petName: petDetail.name,
                            reason: nextVisit.reason,
                            date: nextVisit.next_visit_date,
                            clinicName: nextVisit.clinic_name,
                            veterinarian: nextVisit.veterinarian,
                          })}
                          className="btn-pill-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                          title="Download .ics file for Apple & Outlook calendars"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.ICS File</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Timeline of Clinical Visits */}
                {petDetail.vet_visits && petDetail.vet_visits.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-xs text-[#777b86]">
                      <span>Clinical Timeline ({petDetail.vet_visits.length} recorded visits)</span>
                      <span>Sorted newest to oldest</span>
                    </div>

                    <div className="relative pl-6 md:pl-8 border-l border-[#ececec] space-y-8">
                      {petDetail.vet_visits.map((v) => (
                        <div key={v.visit_id} className="relative group">
                          {/* Dot on Timeline */}
                          <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#17191c] group-hover:scale-125 transition-transform" />

                          <div className="card-floating p-6 space-y-4">
                            {/* Visit Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#ececec]/80 pb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-semibold text-[#17191c] bg-[#f2f2f3] px-2.5 py-0.5 rounded-full">
                                    {v.visit_date}
                                  </span>
                                  <h4 className="font-serif text-lg font-medium text-[#17191c]">
                                    {v.reason}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[#777b86] mt-1">
                                  {v.clinic_name && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-[#a3a6af]" />
                                      {v.clinic_name}
                                    </span>
                                  )}
                                  {v.veterinarian && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3 text-[#a3a6af]" />
                                      {v.veterinarian}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {v.cost_usd && (
                                  <span className="text-xs font-mono font-medium text-[#17191c] bg-[#fafafb] border border-[#ececec] px-2.5 py-1 rounded-full">
                                    ${v.cost_usd.toFixed(2)}
                                  </span>
                                )}
                                <button
                                  onClick={() => setModal({ type: 'editVisit', data: v })}
                                  className="p-1.5 text-[#777b86] hover:text-[#17191c] transition-colors"
                                  title="Edit Visit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVisit(v.visit_id)}
                                  className="p-1.5 text-[#a3a6af] hover:text-red-600 transition-colors"
                                  title="Delete Visit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Weight Recorded */}
                            {v.weight_kg && (
                              <div className="flex items-center gap-2 text-xs">
                                <Scale className="w-3.5 h-3.5 text-[#a3a6af]" />
                                <span className="text-[#777b86]">Recorded Weight:</span>
                                <span className="font-mono font-medium text-[#17191c]">{v.weight_kg} kg</span>
                                {v.weight_kg !== petDetail.weight_kg && (
                                  <span className="text-[10px] text-[#a3a6af]">
                                    (Current profile: {petDetail.weight_kg} kg)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Clinical Findings & Treatment Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {v.diagnosis && (
                                <div className="p-3.5 rounded-inputs bg-[#fafafb] border border-[#ececec] space-y-1">
                                  <span className="font-medium text-[#17191c] uppercase tracking-wider text-[10px] block">
                                    Clinical Diagnosis & Examination
                                  </span>
                                  <p className="text-[#777b86] leading-relaxed">{v.diagnosis}</p>
                                </div>
                              )}

                              {v.treatment_plan && (
                                <div className="p-3.5 rounded-inputs bg-[#fafafb] border border-[#ececec] space-y-1">
                                  <span className="font-medium text-[#17191c] uppercase tracking-wider text-[10px] block">
                                    Administered Treatment & Actions
                                  </span>
                                  <p className="text-[#777b86] leading-relaxed">{v.treatment_plan}</p>
                                </div>
                              )}
                            </div>

                            {/* Medications Pill List */}
                            {v.medications && (
                              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                                <span className="text-[#777b86] flex items-center gap-1 font-medium">
                                  <Pill className="w-3.5 h-3.5 text-[#5d2a1a]" />
                                  <span>Medications:</span>
                                </span>
                                {v.medications.split(',').map((med, idx) => (
                                  <span key={idx} className="bg-[#f2f2f3] text-[#17191c] px-2.5 py-0.5 rounded-full font-sans text-xs">
                                    {med.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Follow-up Note with Calendar Integration */}
                            {v.next_visit_date && (() => {
                              const urgency = getVisitUrgency(v.next_visit_date);
                              return (
                                <div className="text-[11px] text-[#777b86] flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#ececec]/80">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Calendar className="w-3.5 h-3.5 text-[#5d2a1a]" />
                                    <span>Follow-up: <strong className="text-[#17191c]">{v.next_visit_date}</strong></span>
                                    {urgency && (
                                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                        urgency.status === 'overdue'
                                          ? 'bg-red-100 text-red-700'
                                          : urgency.status === 'today'
                                          ? 'bg-[#5d2a1a] text-white'
                                          : 'bg-[#fbe1d1] text-[#5d2a1a]'
                                      }`}>
                                        {urgency.text}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openGoogleCalendarLink({
                                        petName: petDetail.name,
                                        reason: v.reason,
                                        date: v.next_visit_date,
                                        clinicName: v.clinic_name,
                                        veterinarian: v.veterinarian,
                                        notes: v.diagnosis,
                                      })}
                                      className="btn-pill-ghost text-[10px] py-0.5 px-2.5 h-auto flex items-center gap-1"
                                      title="Add event to Google Calendar"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      Google Cal
                                    </button>
                                    <button
                                      onClick={() => downloadIcsFile({
                                        petName: petDetail.name,
                                        reason: v.reason,
                                        date: v.next_visit_date,
                                        clinicName: v.clinic_name,
                                        veterinarian: v.veterinarian,
                                        notes: v.diagnosis,
                                      })}
                                      className="btn-pill-ghost text-[10px] py-0.5 px-2 h-auto flex items-center gap-1"
                                      title="Download .ics file"
                                    >
                                      <Download className="w-3 h-3" />
                                      .ICS
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-cards border-2 border-dashed border-[#ececec] text-center space-y-3 bg-[#fafafb]">
                    <Stethoscope className="w-8 h-8 text-[#a3a6af] mx-auto" />
                    <h4 className="font-serif text-lg text-[#17191c]">No Veterinary Visits Recorded</h4>
                    <p className="text-xs text-[#777b86] max-w-sm mx-auto">
                      Log wellness checkups, vaccination boosters, dental procedures, and doctor diagnoses to track {petDetail.name}'s medical health.
                    </p>
                    <button
                      onClick={() => setModal({ type: 'addVisit', data: null })}
                      className="btn-pill-filled text-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Vet Visit</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: SAFETY CHECKER ────────────────────────────────────── */}
            {activeTab === "safety" && (
              <div className="card-floating p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-serif text-[#17191c]">
                    Food Safety & Allergy Evaluation for {petDetail.name}
                  </h3>
                  <p className="text-xs text-[#777b86] mt-1">
                    Directly check any ingredient against {petDetail.species_name} biochemistry and known sensitivities ({petDetail.allergies_sensitivities || "None noted"}).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={safetyFood}
                      onChange={(e) => setSafetyFood(e.target.value)}
                      placeholder="e.g. Chicken Breast, Salmon, Chocolate, Garlic, Carrot..."
                      list="foods-list"
                      className="w-full px-4 py-2.5 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
                    />
                    <datalist id="foods-list">
                      {availableFoods.map((f) => (
                        <option key={f.food_id} value={f.name} />
                      ))}
                    </datalist>
                  </div>

                  <button
                    onClick={handleCheckSafety}
                    disabled={safetyLoading || !safetyFood}
                    className="btn-pill-filled text-xs w-full sm:w-auto"
                  >
                    {safetyLoading ? "Evaluating..." : "Check Ingredient"}
                  </button>
                </div>

                {/* Safety Result Display */}
                {safetyResult && (
                  <div className="p-6 rounded-cards border border-[#ececec] bg-[#fafafb] space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-serif text-2xl font-bold ${
                            safetyResult.is_toxic || safetyResult.health_grade === "F"
                              ? "bg-[#fbe1d1] text-[#5d2a1a]"
                              : safetyResult.health_grade === "A"
                              ? "bg-green-100 text-green-900"
                              : "bg-[#f2f2f3] text-[#17191c]"
                          }`}
                        >
                          {safetyResult.health_grade}
                        </div>
                        <div>
                          <h4 className="font-serif text-lg text-[#17191c]">
                            {safetyFood} for {petDetail.species_name}
                          </h4>
                          <p className="text-xs text-[#777b86]">
                            Model Confidence: {Math.round(safetyResult.confidence * 100)}%
                          </p>
                        </div>
                      </div>

                      {safetyResult.is_toxic ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fbe1d1] text-[#5d2a1a] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>TOXIC RISK: {safetyResult.severity?.toUpperCase()}</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verified Safe for {petDetail.species_name}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#17191c] leading-relaxed border-t border-[#ececec] pt-3">
                      {safetyResult.explanation_text}
                    </p>

                    {/* Check if user food matches pet's personal allergies */}
                    {petDetail.allergies_sensitivities &&
                      safetyFood.toLowerCase().split(' ').some((word) =>
                        petDetail.allergies_sensitivities.toLowerCase().includes(word) && word.length > 2
                      ) && (
                        <div className="p-3 rounded bg-[#fbe1d1] text-[#5d2a1a] text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            <strong>Personal Allergy Caution:</strong> {petDetail.name} has a recorded sensitivity that matches this ingredient!
                          </span>
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {/* Modal 1: Add / Edit Pet */}
      {(modal.type === "addPet" || modal.type === "editPet") && (
        <PetFormModal
          isOpen={true}
          isEdit={modal.type === "editPet"}
          initialData={modal.data}
          speciesList={speciesList}
          onClose={() => setModal({ type: null, data: null })}
          onSave={handleSavePet}
        />
      )}

      {/* Modal 2: Add / Edit Diet */}
      {(modal.type === "addDiet" || modal.type === "editDiet") && (
        <DietFormModal
          isOpen={true}
          isEdit={modal.type === "editDiet"}
          initialData={modal.data}
          pet={petDetail}
          availableFoods={availableFoods}
          onClose={() => setModal({ type: null, data: null })}
          onSave={handleSaveDiet}
        />
      )}

      {/* Modal 3: Add / Edit Vet Visit */}
      {(modal.type === "addVisit" || modal.type === "editVisit") && (
        <VetVisitFormModal
          isOpen={true}
          isEdit={modal.type === "editVisit"}
          initialData={modal.data}
          pet={petDetail}
          onClose={() => setModal({ type: null, data: null })}
          onSave={handleSaveVisit}
        />
      )}

      {/* Steep Footer */}
      <footer className="border-t border-[#ececec] bg-[#ffffff] py-8 px-8 mt-12">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#a3a6af] gap-2">
          <span>NutriPet Clinical Intelligence Platform</span>
          <span>Veterinary Standards NRC & WSAVA Compliant</span>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function PetFormModal({ isOpen, isEdit, initialData, speciesList, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || "");
  const [speciesName, setSpeciesName] = useState(initialData?.species_name || "Dog");
  const [breed, setBreed] = useState(initialData?.breed || "");
  const [ageYears, setAgeYears] = useState(initialData?.age_years || "");
  const [weightKg, setWeightKg] = useState(initialData?.weight_kg || 10.0);
  const [activityLevel, setActivityLevel] = useState(initialData?.activity_level || "normal");
  const [avatarEmoji, setAvatarEmoji] = useState(initialData?.avatar_emoji || "🐕");
  const [allergies, setAllergies] = useState(initialData?.allergies_sensitivities || "");
  const [notes, setNotes] = useState(initialData?.medical_notes || "");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter pet's name");
    if (weightKg <= 0) return alert("Weight must be greater than 0 kg");

    onSave({
      name: name.trim(),
      species_name: speciesName,
      breed: breed.trim() || null,
      age_years: ageYears ? parseFloat(ageYears) : null,
      weight_kg: parseFloat(weightKg),
      activity_level: activityLevel,
      avatar_emoji: avatarEmoji,
      allergies_sensitivities: allergies.trim() || null,
      medical_notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-cards max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-[#ececec] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#ececec] pb-4">
          <h3 className="font-serif text-2xl text-[#17191c]">
            {isEdit ? "Edit Pet Profile" : "Register New Pet"}
          </h3>
          <button onClick={onClose} className="text-[#a3a6af] hover:text-[#17191c] text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Avatar Emoji Picker */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-2">Avatar Emoji</label>
            <div className="flex items-center gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setAvatarEmoji(em)}
                  className={`w-9 h-9 rounded-full text-lg flex items-center justify-center border transition-all ${
                    avatarEmoji === em
                      ? "border-[#17191c] bg-[#fbe1d1]/50 scale-110 shadow-sm"
                      : "border-[#ececec] hover:border-[#a3a6af]"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Species */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Luna, Milo, Bella"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Species *</label>
              <select
                value={speciesName}
                onChange={(e) => setSpeciesName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c] bg-white"
              >
                {speciesList.length > 0 ? (
                  speciesList.map((s) => (
                    <option key={s.species_id} value={s.name}>
                      {s.name} ({s.digestive_type})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Hamster">Hamster</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Guinea Pig">Guinea Pig</option>
                    <option value="Turtle">Turtle</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Breed & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Breed</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Golden Retriever, Persian"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Age (Years)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>

          {/* Weight & Activity Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Current Body Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c] bg-white"
              >
                {ACTIVITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label} ({a.desc})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allergies / Sensitivities */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-1">
              Known Allergies & Sensitivities
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Corn, Dairy, Chicken, Gluten"
              className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
            />
          </div>

          {/* Medical Notes */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-1">
              General Medical Notes & Observations
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. High energy working dog, monitored for joint wellness..."
              className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#ececec] text-xs text-[#777b86] hover:text-[#17191c]"
            >
              Cancel
            </button>
            <button type="submit" className="btn-pill-filled text-xs">
              {isEdit ? "Update Profile" : "Register Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DietFormModal({ isOpen, isEdit, initialData, pet, availableFoods, onClose, onSave }) {
  const [dietName, setDietName] = useState(initialData?.diet_name || `Balanced ${pet?.species_name || 'Pet'} Regimen`);
  const [dietType, setDietType] = useState(initialData?.diet_type || "Raw");
  const [caloriesTarget, setCaloriesTarget] = useState(initialData?.daily_calories_target || pet?.mer_kcal || 500);
  const [mealsPerDay, setMealsPerDay] = useState(initialData?.meals_per_day || 2);
  const [scheduleTime, setScheduleTime] = useState(initialData?.schedule_time || "08:00 AM & 06:00 PM");
  const [isActive, setIsActive] = useState(initialData ? initialData.is_active : true);
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Ingredients state
  const [ingredients, setIngredients] = useState(() => {
    if (initialData?.ingredients_json) {
      try {
        const parsed = JSON.parse(initialData.ingredients_json);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      { food_name: "Chicken Breast", grams: 250, category: "Meat", calories: 412 },
      { food_name: "Pumpkin", grams: 100, category: "Vegetable", calories: 26 },
    ];
  });

  const addIngredientRow = () => {
    setIngredients([...ingredients, { food_name: "", grams: 100, category: "Other", calories: 150 }]);
  };

  const updateIngredientRow = (idx, field, val) => {
    const updated = [...ingredients];
    updated[idx][field] = val;
    setIngredients(updated);
  };

  const removeIngredientRow = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dietName.trim()) return alert("Please specify a diet name");

    onSave({
      diet_name: dietName.trim(),
      diet_type: dietType,
      daily_calories_target: caloriesTarget ? parseFloat(caloriesTarget) : null,
      meals_per_day: parseInt(mealsPerDay),
      schedule_time: scheduleTime.trim() || null,
      ingredients_json: JSON.stringify(ingredients),
      is_active: isActive,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-cards max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-[#ececec] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#ececec] pb-4">
          <div>
            <h3 className="font-serif text-2xl text-[#17191c]">
              {isEdit ? "Edit Diet Regimen" : "Formulate New Diet"}
            </h3>
            <p className="text-xs text-[#777b86]">For {pet?.name} ({pet?.species_name})</p>
          </div>
          <button onClick={onClose} className="text-[#a3a6af] hover:text-[#17191c] text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Diet Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Diet Title *</label>
              <input
                type="text"
                required
                value={dietName}
                onChange={(e) => setDietName(e.target.value)}
                placeholder="e.g. Fresh Chicken & Pumpkin Raw Mix"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Diet Type</label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c] bg-white"
              >
                {DIET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Caloric Target & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">
                Daily Calories (kcal)
              </label>
              <input
                type="number"
                step="1"
                min="10"
                value={caloriesTarget}
                onChange={(e) => setCaloriesTarget(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
              <span className="text-[10px] text-[#a3a6af]">MER: ~{pet?.mer_kcal} kcal</span>
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Meals / Day</label>
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c] bg-white"
              >
                <option value={1}>1 meal/day</option>
                <option value={2}>2 meals/day</option>
                <option value={3}>3 meals/day</option>
                <option value={4}>4 meals/day</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Schedule Timing</label>
              <input
                type="text"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                placeholder="e.g. 08:00 AM & 06:00 PM"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#17191c] uppercase tracking-wider">
                Recipe Ingredients & Portions
              </label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="text-[11px] font-medium text-[#17191c] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2 border border-[#ececec] p-3 rounded-inputs bg-[#fafafb]">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.food_name}
                    onChange={(e) => updateIngredientRow(idx, "food_name", e.target.value)}
                    placeholder="Food name (e.g. Chicken Breast)"
                    list="ingredient-food-list"
                    className="flex-2 px-2.5 py-1.5 rounded-inputs border border-[#ececec] text-xs bg-white focus:outline-none focus:border-[#17191c]"
                  />
                  <input
                    type="number"
                    value={ing.grams}
                    onChange={(e) => updateIngredientRow(idx, "grams", parseFloat(e.target.value) || 0)}
                    placeholder="Grams"
                    className="w-20 px-2 py-1.5 rounded-inputs border border-[#ececec] text-xs bg-white text-right font-mono focus:outline-none focus:border-[#17191c]"
                  />
                  <span className="text-[10px] text-[#777b86]">g</span>
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(idx)}
                    className="text-[#a3a6af] hover:text-red-600 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <datalist id="ingredient-food-list">
                {availableFoods?.map((f) => (
                  <option key={f.food_id} value={f.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_diet"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[#ececec] text-[#17191c] focus:ring-0"
            />
            <label htmlFor="is_active_diet" className="text-xs text-[#17191c] cursor-pointer">
              Set as <strong>Current Active Feeding Regimen</strong> for {pet?.name}
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-1">
              Preparation & Feeding Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Thaw overnight, add omega-3 fish oil, serve at room temperature..."
              className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#ececec] text-xs text-[#777b86] hover:text-[#17191c]"
            >
              Cancel
            </button>
            <button type="submit" className="btn-pill-filled text-xs">
              {isEdit ? "Update Diet" : "Save Diet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VetVisitFormModal({ isOpen, isEdit, initialData, pet, onClose, onSave }) {
  const [visitDate, setVisitDate] = useState(initialData?.visit_date || new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState(initialData?.reason || "Annual Wellness & Vaccines");
  const [clinicName, setClinicName] = useState(initialData?.clinic_name || "Oak Valley Animal Hospital");
  const [veterinarian, setVeterinarian] = useState(initialData?.veterinarian || "Dr. Elena Vance, DVM");
  const [weightKg, setWeightKg] = useState(initialData?.weight_kg || pet?.weight_kg || "");
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || "");
  const [treatmentPlan, setTreatmentPlan] = useState(initialData?.treatment_plan || "");
  const [medications, setMedications] = useState(initialData?.medications || "");
  const [nextVisitDate, setNextVisitDate] = useState(initialData?.next_visit_date || "");
  const [costUsd, setCostUsd] = useState(initialData?.cost_usd || "");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!visitDate) return alert("Please select visit date");
    if (!reason.trim()) return alert("Please enter reason for visit");

    onSave({
      visit_date: visitDate,
      reason: reason.trim(),
      clinic_name: clinicName.trim() || null,
      veterinarian: veterinarian.trim() || null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      diagnosis: diagnosis.trim() || null,
      treatment_plan: treatmentPlan.trim() || null,
      medications: medications.trim() || null,
      next_visit_date: nextVisitDate || null,
      cost_usd: costUsd ? parseFloat(costUsd) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-cards max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-[#ececec] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#ececec] pb-4">
          <div>
            <h3 className="font-serif text-2xl text-[#17191c]">
              {isEdit ? "Edit Veterinary Record" : "Record Veterinary Visit"}
            </h3>
            <p className="text-xs text-[#777b86]">Clinical entry for {pet?.name}</p>
          </div>
          <button onClick={onClose} className="text-[#a3a6af] hover:text-[#17191c] text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick Reason suggestions chips */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-1">Quick Select Reason</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {COMMON_VISIT_REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                    reason === r
                      ? "border-[#17191c] bg-[#17191c] text-white"
                      : "border-[#ececec] hover:border-[#a3a6af] text-[#777b86]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Visit Date *</label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Reason for Visit *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual Wellness & Vaccines"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>

          {/* Clinic & Veterinarian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Clinic / Hospital</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Metro Animal Hospital"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Veterinarian</label>
              <input
                type="text"
                value={veterinarian}
                onChange={(e) => setVeterinarian(e.target.value)}
                placeholder="e.g. Dr. Vance, DVM"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>

          {/* Weight at Visit & Total Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">
                Weight Recorded at Visit (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 28.5"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">Total Cost (USD $)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costUsd}
                onChange={(e) => setCostUsd(e.target.value)}
                placeholder="e.g. 150.00"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-1">
              Clinical Findings / Diagnosis
            </label>
            <textarea
              rows={2}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Healthy body condition score 5/9, clear breath sounds, mild tartar on upper molars..."
              className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
            />
          </div>

          {/* Treatment Plan */}
          <div>
            <label className="text-xs font-medium text-[#777b86] block mb-1">
              Administered Treatment / Procedures
            </label>
            <textarea
              rows={2}
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="e.g. Administered 3-year Rabies booster and DHPP core vaccine..."
              className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
            />
          </div>

          {/* Medications & Next Visit Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">
                Prescribed Medications (comma-separated)
              </label>
              <input
                type="text"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="e.g. Simparica Trio, Ear Drops"
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#777b86] block mb-1">
                Next Scheduled Checkup Date
              </label>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inputs border border-[#ececec] text-sm focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#ececec] text-xs text-[#777b86] hover:text-[#17191c]"
            >
              Cancel
            </button>
            <button type="submit" className="btn-pill-filled text-xs">
              {isEdit ? "Update Visit Entry" : "Save Visit Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
