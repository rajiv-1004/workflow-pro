import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Mail,
  Shield,
  Building,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { profileApi } from '../../api/profile';
import { getErrorMessage } from '../../utils/errors';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync state if user changes
  React.useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: () => profileApi.updateProfile({ full_name: fullName.trim() }),
    onSuccess: async () => {
      await refreshUser();
      setProfileSuccess('Profile details updated successfully.');
      setProfileError(null);
      setTimeout(() => setProfileSuccess(null), 4000);
    },
    onError: (err) => {
      setProfileError(getErrorMessage(err));
      setProfileSuccess(null);
    },
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: () =>
      profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    onSuccess: (res) => {
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    },
    onError: (err) => {
      setPasswordError(getErrorMessage(err));
      setPasswordSuccess(null);
    },
  });

  if (!user) {
    return (
      <PageContainer title="Account Profile">
        <LoadingSpinner text="Loading account profile..." />
      </PageContainer>
    );
  }

  const userRole = user.role?.name || 'employee';

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <PageContainer
      title="Profile & Account Security"
      description="Manage your enterprise identity credentials, organization tenancy, and security settings."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Identity Card & Technical Scoping */}
        <div className="space-y-6">
          {/* Identity Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-brand-100 border-2 border-brand-300 text-brand-700 font-bold text-2xl flex items-center justify-center shadow-xs">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-4">{user.full_name}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>

            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {userRole}
              </span>
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="w-full mt-6 pt-6 border-t border-slate-100 text-left space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="capitalize">{userRole} Authorization Level</span>
              </div>
            </div>
          </div>

          {/* Tenant Scoping Metadata */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tenant Architecture Data
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <User className="w-3 h-3" />
                  <span>User ID</span>
                </div>
                <p className="font-mono text-xs text-slate-800 break-all select-all font-medium mt-1">
                  {user.id}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Building className="w-3 h-3" />
                  <span>Company / Tenant ID</span>
                </div>
                <p className="font-mono text-xs text-slate-800 break-all select-all font-medium mt-1">
                  {user.company_id}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Key className="w-3 h-3" />
                  <span>Role ID</span>
                </div>
                <p className="font-mono text-xs text-slate-800 break-all select-all font-medium mt-1">
                  {user.role_id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile & Change Password Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Edit Profile Form */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your display name across WorkFlow Pro.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 text-xs text-slate-500 rounded-xl border border-slate-200 cursor-not-allowed font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Email is locked to your organization domain identity.
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Change Password Form */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your account is using a long, secure password (minimum 8 characters).
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
