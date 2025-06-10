import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface Settings {
  siteName: string;
  adminEmail: string;
  modelDefaults: {
    temperature: number;
    maxTokens: number;
  };
  notifications: {
    emailAlerts: boolean;
    slackIntegration: boolean;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    siteName: 'BetSmart AI',
    adminEmail: 'admin@betsmartai.com',
    modelDefaults: {
      temperature: 0.7,
      maxTokens: 2048
    },
    notifications: {
      emailAlerts: true,
      slackIntegration: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle settings update
    console.log('Settings updated:', settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              General Settings
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="siteName"
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="adminEmail"
                    id="adminEmail"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Defaults */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Model Defaults
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Temperature
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="temperature"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.modelDefaults.temperature}
                    onChange={(e) => setSettings({
                      ...settings,
                      modelDefaults: {
                        ...settings.modelDefaults,
                        temperature: parseFloat(e.target.value)
                      }
                    })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Tokens
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="maxTokens"
                    id="maxTokens"
                    value={settings.modelDefaults.maxTokens}
                    onChange={(e) => setSettings({
                      ...settings,
                      modelDefaults: {
                        ...settings.modelDefaults,
                        maxTokens: parseInt(e.target.value)
                      }
                    })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="mt-6 space-y-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="emailAlerts"
                    name="emailAlerts"
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailAlerts: e.target.checked
                      }
                    })}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="emailAlerts" className="font-medium text-gray-700 dark:text-gray-300">
                    Email Alerts
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Receive email notifications for important events.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="slackIntegration"
                    name="slackIntegration"
                    type="checkbox"
                    checked={settings.notifications.slackIntegration}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        slackIntegration: e.target.checked
                      }
                    })}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="slackIntegration" className="font-medium text-gray-700 dark:text-gray-300">
                    Slack Integration
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Send notifications to Slack channel.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;