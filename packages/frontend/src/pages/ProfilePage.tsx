import { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import * as api from '../services/licensingApi';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [company, setCompany] = useState(user?.company || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setCompany(user.company || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ firstName, lastName, company, phone });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info */}
          <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Account Information</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input value={user?.email || ''} disabled
                  className="w-full bg-navy-900/50 border border-navy-700 rounded-lg px-3 py-2.5 text-gray-500 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 py-2.5 rounded-lg font-semibold hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-navy-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
              </div>
              <button type="submit" disabled={changingPassword}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-navy-950 py-2.5 rounded-lg font-semibold hover:shadow-glow transition-all disabled:opacity-50">
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
