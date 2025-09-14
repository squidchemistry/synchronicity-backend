import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { generateAvatarInitials, generateAvatarColor } from '@/utils/format';
import { cn } from '@/utils/cn';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface ProfileForm {
  username: string;
  preferences: {
    theme: 'light' | 'dark';
    currency: string;
    notifications: boolean;
  };
}

const ProfilePage = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileForm>({
    defaultValues: {
      username: user?.username || '',
      preferences: {
        theme: user?.preferences?.theme || 'dark',
        currency: user?.preferences?.currency || 'USD',
        notifications: user?.preferences?.notifications ?? true,
      }
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data);
    } catch (error) {
      // Error handled by store
    }
  };

  const avatarInitials = user ? generateAvatarInitials(user.username) : 'U';
  const avatarColor = user ? generateAvatarColor(user.username) : 'bg-gray-500';

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card card-body">
        <div className="flex items-center space-x-6">
          {user?.avatar ? (
            <img
              className="h-20 w-20 rounded-full"
              src={user.avatar}
              alt={user.username}
            />
          ) : (
            <div
              className={cn(
                'h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white',
                avatarColor
              )}
            >
              {avatarInitials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
            <p className="text-gray-400">{user?.email}</p>
            <p className="text-sm text-gray-500">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>
              <p className="text-sm text-gray-400 mt-1">
                Update your account information and profile details
              </p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters',
                      },
                      maxLength: {
                        value: 30,
                        message: 'Username must be less than 30 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores',
                      },
                    })}
                    type="text"
                    className="input"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-danger-400">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary btn-md"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Theme Preferences */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  {theme === 'dark' ? (
                    <MoonIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <SunIcon className="h-5 w-5 mr-2" />
                  )}
                  Appearance
                </h3>
              </div>
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Theme</p>
                    <p className="text-sm text-gray-400">
                      Choose between light and dark themes
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="btn-secondary btn-md"
                  >
                    {theme === 'dark' ? (
                      <>
                        <SunIcon className="h-4 w-4 mr-2" />
                        Switch to Light
                      </>
                    ) : (
                      <>
                        <MoonIcon className="h-4 w-4 mr-2" />
                        Switch to Dark
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Currency Preferences */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  Currency
                </h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Default Currency</p>
                      <p className="text-sm text-gray-400">
                        Choose your preferred currency for displaying prices
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        {...register('preferences.currency')}
                        className="input w-auto"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="BTC">BTC (₿)</option>
                        <option value="ETH">ETH (Ξ)</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary btn-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <BellIcon className="h-5 w-5 mr-2" />
                  Notifications
                </h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-400">
                          Receive notifications about price alerts and portfolio updates
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          {...register('preferences.notifications')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary btn-md"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Preferences'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;