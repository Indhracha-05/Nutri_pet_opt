import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Utensils,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ExternalLink,
  Download,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { usePetNotifications } from '../hooks/usePetNotifications';
import { openGoogleCalendarLink, downloadIcsFile } from '../utils/calendarExport';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'meals' | 'vet'
  const dropdownRef = useRef(null);

  const {
    counts,
    vet_reminders,
    meal_reminders,
    loading,
    permission,
    requestDesktopPermission,
    testNotification,
    toggleMealFed,
    isMealFed,
    refreshNotifications,
  } = usePetNotifications();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasUrgentAlerts = counts.overdue > 0 || counts.today > 0;
  const badgeCount = counts.total_vet_alerts + counts.active_meals;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refreshNotifications();
        }}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
          isOpen
            ? 'bg-[#17191c] text-white shadow-sm'
            : 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#17191c] border border-[#ececec]'
        }`}
        title="Meal Times & Vet Visit Notifications"
        aria-label="Care notifications"
      >
        <Bell className={`w-4 h-4 ${hasUrgentAlerts && !isOpen ? 'text-[#5d2a1a]' : ''}`} />

        {/* Badge counter */}
        {badgeCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full flex items-center justify-center leading-none ${
              hasUrgentAlerts
                ? 'bg-[#5d2a1a] text-white ring-2 ring-white animate-pulse'
                : 'bg-[#17191c] text-white ring-2 ring-white'
            }`}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {/* Flyout Modal / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] sm:w-[440px] max-h-[85vh] bg-white border border-[#ececec] rounded-cards shadow-floating z-50 flex flex-col overflow-hidden text-[#17191c] animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#ececec] bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5d2a1a]" />
                <h3 className="font-serif text-xl tracking-tight text-[#17191c]">
                  Care & Feeding Reminders
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={refreshNotifications}
                  disabled={loading}
                  className="p-1.5 text-[#777b86] hover:text-[#17191c] rounded-full hover:bg-[#f2f2f3] transition-colors"
                  title="Refresh reminders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#777b86] hover:text-[#17191c] rounded-full hover:bg-[#f2f2f3] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-[#777b86] leading-relaxed">
              Real-time alerts for scheduled nutrition feeds and veterinary checkups.
            </p>

            {/* Desktop Notification Banner */}
            <div className="mt-3 p-3 rounded-2xl border transition-colors bg-[#fafafb] border-[#ececec]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      permission === 'granted' ? 'text-emerald-600' : 'text-[#5d2a1a]'
                    }`}
                  />
                  <div className="text-[11px]">
                    <span className="font-medium text-[#17191c]">
                      {permission === 'granted'
                        ? 'Desktop push notifications enabled'
                        : 'Desktop notifications inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {permission !== 'granted' ? (
                    <button
                      onClick={requestDesktopPermission}
                      className="btn-pill-filled text-[11px] py-1 px-3 h-auto"
                    >
                      Enable Alerts
                    </button>
                  ) : (
                    <button
                      onClick={testNotification}
                      className="btn-pill-ghost text-[11px] py-1 px-2.5 h-auto"
                    >
                      Test Alert
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-4 pt-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`chip-pill text-xs py-1 px-3 ${activeTab === 'all' ? 'selected' : ''}`}
              >
                All ({badgeCount})
              </button>
              <button
                onClick={() => setActiveTab('meals')}
                className={`chip-pill text-xs py-1 px-3 flex items-center gap-1 ${
                  activeTab === 'meals' ? 'selected' : ''
                }`}
              >
                <Utensils className="w-3 h-3" />
                Meal Schedules ({counts.active_meals})
              </button>
              <button
                onClick={() => setActiveTab('vet')}
                className={`chip-pill text-xs py-1 px-3 flex items-center gap-1 ${
                  activeTab === 'vet' ? 'selected' : ''
                }`}
              >
                <Calendar className="w-3 h-3" />
                Vet Care ({counts.total_vet_alerts})
              </button>
            </div>
          </div>

          {/* Reminders Scroll Area */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 max-h-[50vh] bg-[#fafafb]/50">
            {/* Empty State */}
            {badgeCount === 0 && (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#f2f2f3] text-[#777b86] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-serif text-base text-[#17191c]">All Care Protocols Clear</h4>
                <p className="text-xs text-[#777b86] max-w-[280px] mx-auto">
                  No overdue or upcoming vet appointments within 7 days, and no active meal plans configured.
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/pets');
                  }}
                  className="btn-pill-ghost text-xs py-1.5 px-3 mt-2 inline-flex items-center gap-1"
                >
                  Configure Pet Profiles →
                </button>
              </div>
            )}

            {/* SECTION 1: VET VISITS */}
            {(activeTab === 'all' || activeTab === 'vet') && vet_reminders.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#777b86] px-1">
                  <span>CLINICAL VETERINARY TIMELINE</span>
                  <span>{vet_reminders.length} scheduled</span>
                </div>

                {vet_reminders.map((visit) => {
                  const isOverdue = visit.status === 'overdue';
                  const isToday = visit.status === 'today';
                  const isSoon = visit.status === 'upcoming_week';

                  return (
                    <div
                      key={visit.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isOverdue
                          ? 'bg-red-50/80 border-red-200 text-red-950'
                          : isToday
                          ? 'bg-[#fbe1d1]/70 border-[#5d2a1a]/25 text-[#5d2a1a]'
                          : 'bg-white border-[#ececec] text-[#17191c]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl leading-none mt-0.5">{visit.avatar_emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-xs text-[#17191c]">
                                {visit.pet_name}
                              </span>
                              {isOverdue && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Overdue by {Math.abs(visit.days_until)}d
                                </span>
                              )}
                              {isToday && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#5d2a1a] text-white">
                                  Scheduled Today
                                </span>
                              )}
                              {isSoon && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#f2f2f3] text-[#17191c]">
                                  In {visit.days_until} days
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-serif mt-1 font-medium text-[#17191c]">
                              {visit.reason}
                            </p>

                            <p className="text-[11px] text-[#777b86] mt-0.5">
                              {visit.clinic_name || 'Veterinary Clinic'}
                              {visit.veterinarian ? ` • ${visit.veterinarian}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-[#777b86] block font-mono">
                            {visit.next_visit_date}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 text-[11px]">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/pets?petId=${visit.pet_id}`);
                          }}
                          className="text-[#777b86] hover:text-[#17191c] flex items-center gap-1 transition-colors"
                        >
                          View Profile <ChevronRight className="w-3 h-3" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              openGoogleCalendarLink({
                                petName: visit.pet_name,
                                reason: visit.reason,
                                date: visit.next_visit_date,
                                clinicName: visit.clinic_name,
                                veterinarian: visit.veterinarian,
                              })
                            }
                            className="btn-pill-ghost text-[10px] py-0.5 px-2.5 h-auto flex items-center gap-1"
                            title="Add event to Google Calendar"
                          >
                            <Calendar className="w-3 h-3" />
                            Google Cal
                          </button>
                          <button
                            onClick={() =>
                              downloadIcsFile({
                                petName: visit.pet_name,
                                reason: visit.reason,
                                date: visit.next_visit_date,
                                clinicName: visit.clinic_name,
                                veterinarian: visit.veterinarian,
                              })
                            }
                            className="btn-pill-ghost text-[10px] py-0.5 px-2 h-auto flex items-center gap-1"
                            title="Download .ics file for Apple/Outlook Calendar"
                          >
                            <Download className="w-3 h-3" />
                            .ICS
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SECTION 2: MEAL SCHEDULES */}
            {(activeTab === 'all' || activeTab === 'meals') && meal_reminders.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#777b86] px-1">
                  <span>ACTIVE FEEDING PROTOCOLS</span>
                  <span>{meal_reminders.length} active diets</span>
                </div>

                {meal_reminders.map((meal) => {
                  const fed = isMealFed(meal.diet_id);

                  return (
                    <div
                      key={meal.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        fed
                          ? 'bg-emerald-50/40 border-emerald-200/60 opacity-75'
                          : 'bg-white border-[#ececec]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl leading-none mt-0.5">{meal.avatar_emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-[#17191c]">
                                {meal.pet_name}
                              </span>
                              <span className="text-[10px] text-[#777b86] uppercase tracking-wider">
                                {meal.diet_type}
                              </span>
                            </div>

                            <p
                              className={`text-xs font-serif mt-1 font-medium ${
                                fed ? 'line-through text-[#777b86]' : 'text-[#17191c]'
                              }`}
                            >
                              {meal.diet_name}
                            </p>

                            <div className="flex items-center gap-2 text-[11px] text-[#777b86] mt-1">
                              <span className="flex items-center gap-1 font-medium text-[#17191c]">
                                <Clock className="w-3 h-3 text-[#5d2a1a]" />
                                {meal.schedule_time}
                              </span>
                              <span>•</span>
                              <span>{meal.meals_per_day} meals/day</span>
                              {meal.daily_calories_target && (
                                <>
                                  <span>•</span>
                                  <span>{Math.round(meal.daily_calories_target)} kcal</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mark Fed Checkbox */}
                        <button
                          onClick={() => toggleMealFed(meal.diet_id)}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            fed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#f2f2f3] hover:bg-[#e8e8ea] text-[#17191c]'
                          }`}
                          title={fed ? 'Marked as fed today (Click to uncheck)' : 'Mark as fed today'}
                        >
                          {fed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Fed Today</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5 text-[#a3a6af]" />
                              <span>Mark Fed</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 sm:px-5 border-t border-[#ececec] bg-white flex items-center justify-between text-[11px] text-[#777b86]">
            <span>Desktop timers check schedules every minute.</span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/pets');
              }}
              className="text-[#17191c] hover:underline font-medium"
            >
              Manage Pets →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
