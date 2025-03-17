import React, { useState } from 'react';

const DataControls = ({ user }) => {
  const [settings, setSettings] = useState({
    shareOverview: true,
    shareConnections: false,
    shareWithPartners: false,
    anonymizeData: true
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Data Sharing Controls
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage how your data is shared and used
        </p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Share Data Overview
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <button 
                  onClick={() => handleToggle('shareOverview')}
                  className={`${
                    settings.shareOverview ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <span 
                    className={`${
                      settings.shareOverview ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
                <span className="ml-3">
                  {settings.shareOverview ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Share Connected Accounts
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <button 
                  onClick={() => handleToggle('shareConnections')}
                  className={`${
                    settings.shareConnections ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <span 
                    className={`${
                      settings.shareConnections ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
                <span className="ml-3">
                  {settings.shareConnections ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Share With Partners
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <button 
                  onClick={() => handleToggle('shareWithPartners')}
                  className={`${
                    settings.shareWithPartners ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <span 
                    className={`${
                      settings.shareWithPartners ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
                <span className="ml-3">
                  {settings.shareWithPartners ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Anonymize Shared Data
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <button 
                  onClick={() => handleToggle('anonymizeData')}
                  className={`${
                    settings.anonymizeData ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <span 
                    className={`${
                      settings.anonymizeData ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
                <span className="ml-3">
                  {settings.anonymizeData ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default DataControls; 